import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { BPMN_SYSTEM_PROMPT } from './system-prompt';

/**
 * Output esperado do LLM — corresponde ao que o frontend mostra no preview.
 */
export interface BpmnGenerationOutput {
  graph: Record<string, unknown>;
  suggestedTitle: string;
  suggestedSlug: string;
  suggestedDescription: string;
  suggestedCategory: string;
}

const VALID_CATEGORIES = new Set([
  'COMERCIAL',
  'MARKETING',
  'FINANCEIRO',
  'OPERACOES',
  'RH',
  'ATENDIMENTO',
  'ONBOARDING',
  'LOGISTICA',
  'JURIDICO',
  'TI',
  'OUTRO',
]);

@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (this.client) return this.client;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY nao configurada no backend. Adicione a env e redeploy.',
      );
    }
    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  async generateBpmn(userPrompt: string, attachmentsContext: string): Promise<BpmnGenerationOutput> {
    const client = this.getClient();
    const fullUserMessage =
      attachmentsContext.trim().length > 0
        ? `${userPrompt}\n\n--- CONTEUDO DOS ARQUIVOS ANEXADOS ---\n${attachmentsContext}`
        : userPrompt;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: BPMN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fullUserMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('LLM nao retornou bloco de texto');
    }
    const raw = textBlock.text.trim();
    const parsed = this.parseJsonResponse(raw);
    return this.validate(parsed);
  }

  private parseJsonResponse(raw: string): unknown {
    // Strip markdown fences if the model still wraps despite instructions
    let cleaned = raw;
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      this.logger.error(`Falha parse JSON do LLM: ${(err as Error).message}`);
      this.logger.error(`Raw output: ${cleaned.slice(0, 500)}`);
      throw new Error('Saida do LLM nao e JSON valido');
    }
  }

  private validate(parsed: unknown): BpmnGenerationOutput {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Saida do LLM nao e um objeto');
    }
    const obj = parsed as Record<string, unknown>;
    if (!obj.graph || typeof obj.graph !== 'object') {
      throw new Error('Saida do LLM nao contem campo "graph"');
    }
    const graph = obj.graph as Record<string, unknown>;
    if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
      throw new Error('Graph sem nodes');
    }
    if (!Array.isArray(graph.edges)) {
      throw new Error('Graph sem edges (array)');
    }
    // Cross-ref check: every edge.from/to references an existing node id
    const nodeIds = new Set(
      (graph.nodes as Array<Record<string, unknown>>).map((n) => String(n.id)),
    );
    for (const edge of graph.edges as Array<Record<string, unknown>>) {
      if (!nodeIds.has(String(edge.from)) || !nodeIds.has(String(edge.to))) {
        throw new Error(
          `Edge invalida: ${String(edge.from)} -> ${String(edge.to)} (node nao existe)`,
        );
      }
    }
    const category = String(obj.suggestedCategory ?? 'OUTRO').toUpperCase();
    return {
      graph,
      suggestedTitle: String(obj.suggestedTitle ?? 'Fluxo sem titulo'),
      suggestedSlug: this.slugify(String(obj.suggestedSlug ?? obj.suggestedTitle ?? 'novo-fluxo')),
      suggestedDescription: String(obj.suggestedDescription ?? ''),
      suggestedCategory: VALID_CATEGORIES.has(category) ? category : 'OUTRO',
    };
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}
