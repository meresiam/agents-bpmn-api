import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/**
 * Epic 6.B — geracao de imagem por etapa do POP via Gemini (Nano Banana) +
 * armazenamento em volume persistente (lock Tier 1, sem object storage externo).
 *
 * Layout no disco: {POP_IMAGE_DIR}/{popId}/{ordem}.png
 * Servido por: GET /api/v1/chat/pop/image/{popId}/{ordem}.png (publico, uuid nao-enumeravel).
 */
@Injectable()
export class PopImageService {
  private readonly logger = new Logger(PopImageService.name);

  /** Volume persistente no Coolify. Default local cai em ./pop-images pra dev. */
  private get baseDir(): string {
    return process.env.POP_IMAGE_DIR || join(process.cwd(), 'pop-images');
  }

  private get model(): string {
    // Configuravel por env — o nome do modelo de imagem do Gemini muda com versao.
    return process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  }

  /**
   * Gera a imagem de um passo, grava no disco e retorna a URL relativa (com
   * cache-bust pra regeneracao sobrescrever no browser).
   */
  async generateAndStore(popId: string, ordem: number, acao: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY nao configurada no backend. Adicione a env e redeploy.',
      );
    }

    const prompt = this.buildPrompt(acao);
    const base64 = await this.callGemini(apiKey, prompt);

    const dir = join(this.baseDir, popId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, `${ordem}.png`), Buffer.from(base64, 'base64'));

    this.logger.log(`POP imagem gravada: ${popId}/${ordem}.png`);
    return `/api/v1/chat/pop/image/${popId}/${ordem}.png?v=${Date.now()}`;
  }

  /** Le a imagem do disco. Valida popId/file pra barrar path traversal. */
  async readImage(popId: string, file: string): Promise<Buffer> {
    if (!/^[a-f0-9-]{16,64}$/i.test(popId) || !/^\d+\.png$/.test(file)) {
      throw new BadRequestException('Caminho de imagem invalido.');
    }
    try {
      return await fs.readFile(join(this.baseDir, popId, file));
    } catch {
      throw new NotFoundException('Imagem nao encontrada.');
    }
  }

  /** Estilo fixo pra coesao visual entre os passos (style-reference textual). */
  private buildPrompt(acao: string): string {
    return [
      'Ilustracao vetorial flat minimalista, estilo infografico corporativo limpo e moderno.',
      'Paleta: roxo suave (#5850EC), cinza-azulado, branco; fundo claro liso.',
      'Composicao centralizada, simples, profissional.',
      'IMPORTANTE: a imagem NAO deve conter nenhum texto, palavra, letra ou numero.',
      `Cena ilustrando esta etapa de um processo de negocio: ${acao}`,
    ].join(' ');
  }

  /** Chama a REST API do Gemini e extrai o PNG base64 do primeiro inlineData. */
  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      });
    } catch (err) {
      throw new ServiceUnavailableException(`Falha ao chamar Gemini: ${(err as Error).message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
      throw new ServiceUnavailableException(`Gemini retornou ${res.status}.`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string } }> };
      }>;
    };
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!inline) {
      throw new ServiceUnavailableException('Gemini nao retornou imagem.');
    }
    return inline;
  }
}
