import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AnthropicClient } from '../llm/anthropic.client';
import { POP_GENERATION_SYSTEM_PROMPT } from '../llm/system-prompt';
import { ProcessesService } from '../../processes/processes.service';
import { PopRepository } from './pop.repository';
import { PopImageService } from './pop-image.service';
import { UserPayload } from '../../../common/decorators/current-user.decorator';

export interface PopResponsavel {
  papel: string;
  descricao: string;
}

export interface PopPasso {
  ordem: number;
  acao: string;
  responsavel: string;
  entrada: string;
  saida: string;
  pontoControle: string;
  /** URL da ilustracao do passo (Epic 6.B); ausente ate ser gerada. */
  imagemUrl?: string;
}

/** Conteudo estruturado do POP. */
export interface PopContent {
  titulo: string;
  objetivo: string;
  escopo: string;
  responsaveis: PopResponsavel[];
  materiais: string[];
  passos: PopPasso[];
  indicadores: string[];
  riscos: string[];
  /** Versao do processo TO-BE no momento da geracao (Epic 6.C.3 — aviso de POP desatualizado). */
  processVersion: number;
}

export interface GeneratePopResult {
  id: string;
  processId: string;
  version: number;
  status: 'DRAFT' | 'APPROVED';
  sourceKind: 'TO_BE' | 'SINGLE';
  sourceTitle: string;
  content: PopContent;
  llmMs: number;
  createdAt: Date;
}

@Injectable()
export class PopService {
  private readonly logger = new Logger(PopService.name);

  constructor(
    private readonly anthropic: AnthropicClient,
    private readonly processes: ProcessesService,
    private readonly repository: PopRepository,
    private readonly images: PopImageService,
  ) {}

  /**
   * Epic 6.A — gera o POP de um processo e persiste. Carrega o grafo server-side
   * (tenant-scoped); pra um par AS-IS/TO-BE documenta o TO-BE (o desenho otimizado).
   */
  async generateForUser(processId: string, user: UserPayload): Promise<GeneratePopResult> {
    const process = await this.processes.findOneForUser(processId, user);

    // O POP documenta o TO-BE. Se o processo for parte de um par, resolve a face
    // TO_BE; se for SINGLE, documenta ele mesmo.
    let sourceId: string;
    let sourceGraph: Record<string, unknown>;
    let sourceTitle: string;
    let sourceVersion: number;
    let sourceKind: 'TO_BE' | 'SINGLE';

    if (process.processKind === 'SINGLE') {
      sourceKind = 'SINGLE';
      sourceId = process.id;
      sourceGraph = process.graph as Record<string, unknown>;
      sourceTitle = process.title;
      sourceVersion = process.version;
    } else {
      const pair = await this.processes.getPairForUser(processId, user);
      sourceKind = 'TO_BE';
      sourceId = pair.toBe.id;
      sourceGraph = pair.toBe.graph as Record<string, unknown>;
      sourceTitle = pair.toBe.title;
      sourceVersion = pair.toBe.version;
    }

    const userMessage = this.buildUserMessage(sourceGraph, sourceTitle);

    // max_tokens alto: um POP de processo grande (ex 37 nós) gera dezenas de
    // passos + papeis + indicadores + riscos. Com 4096 a saida truncava e o
    // parse JSON falhava (500). 16k cobre fluxos grandes com folga.
    const started = Date.now();
    let content: PopContent;
    try {
      const parsed = await this.anthropic.completeStructured(
        POP_GENERATION_SYSTEM_PROMPT,
        userMessage,
        16384,
      );
      content = this.validate(parsed, sourceTitle, sourceVersion);
    } catch (err) {
      // Erros de infra (ANTHROPIC_API_KEY ausente) sobem como estao; falha de
      // parse/validacao vira mensagem PT-BR acionavel em vez de 500 cru.
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`generate-pop falhou (process=${sourceId}): ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Nao foi possivel gerar o POP a partir deste processo. O fluxo pode ser muito grande ou a resposta veio incompleta; tente novamente.',
      );
    }
    const llmMs = Date.now() - started;

    const version = (await this.repository.maxVersion(sourceId)) + 1;
    const saved = await this.repository.create({
      tenantId: process.tenantId,
      processId: sourceId,
      version,
      status: 'DRAFT',
      content: content as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(
      `POP gerado: process=${sourceId} (${sourceKind}) v${version} ${content.passos.length} passos em ${llmMs}ms`,
    );

    return {
      id: saved.id,
      processId: saved.processId,
      version: saved.version,
      status: saved.status,
      sourceKind,
      sourceTitle,
      content,
      llmMs,
      createdAt: saved.createdAt,
    };
  }

  /** Lista os POPs (metadados, sem content) de um processo, tenant-scoped. */
  async listForUser(processId: string, user: UserPayload) {
    // Reusa o gate de tenant do ProcessesService (403/404 corretos).
    await this.processes.findOneForUser(processId, user);
    return this.repository.findManyByProcess(processId);
  }

  /** Retorna 1 POP com content, validando tenant via o processo de origem. */
  async getForUser(popId: string, user: UserPayload): Promise<GeneratePopResult> {
    const pop = await this.loadOwned(popId, user);
    return this.toResult(pop, 0);
  }

  /**
   * Epic 6.B — gera (ou regenera) ilustracao dos passos indicados. Sem `ordens`,
   * ilustra todos os passos que ainda nao tem imagem. Persiste as URLs no content.
   */
  async illustrateForUser(
    popId: string,
    user: UserPayload,
    ordens?: number[],
  ): Promise<GeneratePopResult> {
    const pop = await this.loadOwned(popId, user);
    const content = pop.content as unknown as PopContent;

    const alvo = new Set(ordens && ordens.length ? ordens : undefined);
    const passosAlvo = content.passos.filter((p) =>
      alvo.size ? alvo.has(p.ordem) : !p.imagemUrl,
    );

    if (passosAlvo.length === 0) {
      throw new BadRequestException('Nenhum passo elegivel pra ilustracao.');
    }
    if (passosAlvo.length > 12) {
      throw new BadRequestException('Maximo de 12 passos por requisicao (controle de custo).');
    }

    // Sequencial: controla custo/rate da API de imagem e mantem ordem dos logs.
    for (const passo of passosAlvo) {
      passo.imagemUrl = await this.images.generateAndStore(pop.id, passo.ordem, passo.acao);
    }

    const saved = await this.repository.update(pop.id, {
      content: content as unknown as Prisma.InputJsonValue,
    });
    this.logger.log(`POP ${pop.id}: ${passosAlvo.length} passo(s) ilustrado(s)`);
    return this.toResult(saved, 0);
  }

  /** Epic 6.C — edicao do POP (content e/ou status). Tenant-scoped. */
  async updateForUser(
    popId: string,
    user: UserPayload,
    patch: { content?: PopContent; status?: 'DRAFT' | 'APPROVED' },
  ): Promise<GeneratePopResult> {
    const pop = await this.loadOwned(popId, user);

    const data: Prisma.PopUpdateInput = {};
    if (patch.content) {
      // Re-normaliza pra impedir shape invalido vindo do cliente; preserva versao da fonte.
      const prev = pop.content as unknown as PopContent;
      const normalized = this.validate(patch.content, prev.titulo, prev.processVersion ?? 1);
      data.content = normalized as unknown as Prisma.InputJsonValue;
    }
    if (patch.status) {
      data.status = patch.status;
    }

    const saved = await this.repository.update(pop.id, data);
    return this.toResult(saved, 0);
  }

  private async loadOwned(popId: string, user: UserPayload) {
    const pop = await this.repository.findById(popId);
    if (!pop) throw new NotFoundException('POP nao encontrado');
    if (user.role !== 'SUPER_ADMIN' && pop.tenantId !== user.tenantId) {
      throw new ForbiddenException();
    }
    return pop;
  }

  private toResult(
    pop: { id: string; processId: string; version: number; status: 'DRAFT' | 'APPROVED'; content: unknown; createdAt: Date },
    llmMs: number,
  ): GeneratePopResult {
    const content = pop.content as PopContent;
    return {
      id: pop.id,
      processId: pop.processId,
      version: pop.version,
      status: pop.status,
      sourceKind: 'TO_BE',
      sourceTitle: content?.titulo ?? '',
      content,
      llmMs,
      createdAt: pop.createdAt,
    };
  }

  private buildUserMessage(graph: Record<string, unknown>, title: string): string {
    return [
      `--- PROCESSO TO-BE: ${title} ---`,
      '```json',
      JSON.stringify(graph),
      '```',
      '',
      'Gere o POP deste processo seguindo o schema. Derive os passos da sequencia de nos.',
    ].join('\n');
  }

  private validate(parsed: unknown, fallbackTitle: string, processVersion: number): PopContent {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Saida do LLM nao e um objeto');
    }
    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj.passos) || obj.passos.length === 0) {
      throw new Error('POP nao retornou passos');
    }

    const passos: PopPasso[] = (obj.passos as Array<Record<string, unknown>>).map((p, i) => ({
      ordem: Number.isFinite(Number(p.ordem)) ? Number(p.ordem) : i + 1,
      acao: String(p.acao ?? '').trim() || `Passo ${i + 1}`,
      responsavel: String(p.responsavel ?? '').trim(),
      entrada: String(p.entrada ?? '').trim(),
      saida: String(p.saida ?? '').trim(),
      pontoControle: String(p.pontoControle ?? '').trim(),
      // Preserva imagem ja gerada (Epic 6.B) — relevante na edicao/reuso, ignorado na geracao.
      ...(typeof p.imagemUrl === 'string' && p.imagemUrl ? { imagemUrl: p.imagemUrl } : {}),
    }));
    // Garante ordem crescente coerente mesmo se o LLM numerar fora de sequencia.
    passos.sort((a, b) => a.ordem - b.ordem);
    passos.forEach((p, i) => (p.ordem = i + 1));

    return {
      titulo: String(obj.titulo ?? '').trim() || `POP — ${fallbackTitle}`,
      objetivo: String(obj.objetivo ?? '').trim(),
      escopo: String(obj.escopo ?? '').trim(),
      responsaveis: this.normalizeResponsaveis(obj.responsaveis),
      materiais: this.normalizeStringList(obj.materiais),
      passos,
      indicadores: this.normalizeStringList(obj.indicadores),
      riscos: this.normalizeStringList(obj.riscos),
      processVersion,
    };
  }

  private normalizeResponsaveis(raw: unknown): PopResponsavel[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return {
          papel: String(o.papel ?? '').trim(),
          descricao: String(o.descricao ?? '').trim(),
        };
      })
      .filter((r) => r.papel.length > 0);
  }

  private normalizeStringList(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => String(s ?? '').trim()).filter((s) => s.length > 0);
  }
}
