import { Injectable, Logger } from '@nestjs/common';
import { AnthropicClient } from '../llm/anthropic.client';
import { GAP_ANALYSIS_SYSTEM_PROMPT } from '../llm/system-prompt';
import { ProcessesService } from '../../processes/processes.service';
import { UserPayload } from '../../../common/decorators/current-user.decorator';

export type GapTipo =
  | 'GARGALO'
  | 'RETRABALHO'
  | 'ETAPA_MANUAL'
  | 'FALTA_DE_DADO'
  | 'RISCO_COMPLIANCE'
  | 'ESPERA'
  | 'OUTRO';

export type GapSeveridade = 'ALTA' | 'MEDIA' | 'BAIXA';
export type GapAbordagem = 'IA' | 'AUTOMACAO' | 'PROCESSO' | 'PESSOAS';

export interface GapSolucao {
  abordagem: GapAbordagem;
  precisaIA: boolean;
  descricao: string;
}

export interface Gap {
  id: string;
  titulo: string;
  tipo: GapTipo;
  severidade: GapSeveridade;
  localizacao: string;
  recomendacao: string;
  solucao: GapSolucao;
}

export interface GapAnalysisResult {
  mode: 'pair' | 'single';
  resumo: string;
  gaps: Gap[];
  llmMs: number;
  asIsTitle: string;
  toBeTitle?: string;
}

const TIPOS = new Set<GapTipo>([
  'GARGALO',
  'RETRABALHO',
  'ETAPA_MANUAL',
  'FALTA_DE_DADO',
  'RISCO_COMPLIANCE',
  'ESPERA',
  'OUTRO',
]);
const SEVERIDADES = new Set<GapSeveridade>(['ALTA', 'MEDIA', 'BAIXA']);
const ABORDAGENS = new Set<GapAbordagem>(['IA', 'AUTOMACAO', 'PROCESSO', 'PESSOAS']);
const SEV_ORDER: Record<GapSeveridade, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name);

  constructor(
    private readonly anthropic: AnthropicClient,
    private readonly processes: ProcessesService,
  ) {}

  /**
   * Epic 4.B — analisa os gaps de um processo. Carrega o grafo server-side
   * (tenant-scoped, reusa a resolucao de par da 4.A); nunca confia em graph do body.
   */
  async analyzeForUser(processId: string, user: UserPayload): Promise<GapAnalysisResult> {
    const process = await this.processes.findOneForUser(processId, user);

    let mode: 'pair' | 'single';
    let asIsGraph: Record<string, unknown>;
    let toBeGraph: Record<string, unknown> | undefined;
    let asIsTitle: string;
    let toBeTitle: string | undefined;

    if (process.processKind === 'SINGLE') {
      mode = 'single';
      asIsGraph = process.graph as Record<string, unknown>;
      asIsTitle = process.title;
    } else {
      const pair = await this.processes.getPairForUser(processId, user);
      mode = 'pair';
      asIsGraph = pair.asIs.graph as Record<string, unknown>;
      toBeGraph = pair.toBe.graph as Record<string, unknown>;
      asIsTitle = pair.asIs.title;
      toBeTitle = pair.toBe.title;
    }

    const userMessage = this.buildUserMessage(asIsGraph, toBeGraph);

    const started = Date.now();
    const parsed = await this.anthropic.completeStructured(
      GAP_ANALYSIS_SYSTEM_PROMPT,
      userMessage,
      4096,
    );
    const llmMs = Date.now() - started;

    const { resumo, gaps } = this.validate(parsed);
    this.logger.log(`GAP analise: ${gaps.length} gaps (mode=${mode}) em ${llmMs}ms`);

    return { mode, resumo, gaps, llmMs, asIsTitle, toBeTitle };
  }

  private buildUserMessage(
    asIsGraph: Record<string, unknown>,
    toBeGraph?: Record<string, unknown>,
  ): string {
    const parts: string[] = [
      '--- PROCESSO AS-IS (como e hoje) ---',
      '```json',
      JSON.stringify(asIsGraph),
      '```',
    ];
    if (toBeGraph) {
      parts.push(
        '',
        '--- PROCESSO TO-BE (como deveria ser) ---',
        '```json',
        JSON.stringify(toBeGraph),
        '```',
        '',
        'Analise os gaps que ainda restam no TO-BE e o que falta pra sair do AS-IS.',
      );
    } else {
      parts.push('', 'Analise os gaps do processo atual (so existe AS-IS).');
    }
    return parts.join('\n');
  }

  private validate(parsed: unknown): { resumo: string; gaps: Gap[] } {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Saida do LLM nao e um objeto');
    }
    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj.gaps) || obj.gaps.length === 0) {
      throw new Error('Analise nao retornou gaps');
    }

    const gaps: Gap[] = (obj.gaps as Array<Record<string, unknown>>).map((g, i) =>
      this.normalizeGap(g, i),
    );
    // Prioriza por severidade (ALTA primeiro) — a UI ja recebe ordenado.
    gaps.sort((a, b) => SEV_ORDER[a.severidade] - SEV_ORDER[b.severidade]);

    return {
      resumo: String(obj.resumo ?? '').trim() || 'Analise de gaps do processo.',
      gaps,
    };
  }

  private normalizeGap(g: Record<string, unknown>, index: number): Gap {
    const tipo = String(g.tipo ?? '').toUpperCase() as GapTipo;
    const severidade = String(g.severidade ?? '').toUpperCase() as GapSeveridade;
    const solucaoRaw = (g.solucao ?? {}) as Record<string, unknown>;
    const abordagem = String(solucaoRaw.abordagem ?? '').toUpperCase() as GapAbordagem;
    const safeAbordagem = ABORDAGENS.has(abordagem) ? abordagem : 'PROCESSO';

    return {
      id: String(g.id ?? `g${index + 1}`),
      titulo: String(g.titulo ?? 'Gap sem titulo').trim(),
      tipo: TIPOS.has(tipo) ? tipo : 'OUTRO',
      severidade: SEVERIDADES.has(severidade) ? severidade : 'MEDIA',
      localizacao: String(g.localizacao ?? '').trim(),
      recomendacao: String(g.recomendacao ?? '').trim(),
      solucao: {
        abordagem: safeAbordagem,
        // precisaIA so e true quando a abordagem for IA — regra do prompt, reforcada aqui.
        precisaIA: safeAbordagem === 'IA' && Boolean(solucaoRaw.precisaIA ?? true),
        descricao: String(solucaoRaw.descricao ?? '').trim(),
      },
    };
  }
}
