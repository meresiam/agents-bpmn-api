import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AnthropicClient, BpmnGenerationOutput } from './llm/anthropic.client';
import { FileExtractorService, ExtractedFile } from './files/file-extractor.service';

export interface GenerateGraphResult extends BpmnGenerationOutput {
  attachments: Array<{ name: string; size: number; truncated: boolean }>;
  llmMs: number;
}

export type StreamEvent =
  | {
      type: 'meta';
      attachments: Array<{ name: string; size: number; truncated: boolean }>;
      mode: 'create' | 'edit';
    }
  | { type: 'delta'; text: string }
  | { type: 'done'; result: GenerateGraphResult }
  | { type: 'error'; message: string };

interface GenerateInput {
  prompt: string;
  files: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>;
  existingGraph?: Record<string, unknown>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly anthropic: AnthropicClient,
    private readonly fileExtractor: FileExtractorService,
  ) {}

  async generateGraph(input: GenerateInput): Promise<GenerateGraphResult> {
    this.assertValidInput(input);

    const extracted = await this.fileExtractor.extractAll(input.files);
    const context = this.fileExtractor.formatForPrompt(extracted.files);

    const started = Date.now();
    const output = await this.anthropic.generateBpmn(input.prompt, context, input.existingGraph);
    const llmMs = Date.now() - started;

    this.logger.log(
      `Graph gerado em ${llmMs}ms (${(output.graph as { nodes: unknown[] }).nodes.length} nodes, ${extracted.files.length} arquivos, mode=${input.existingGraph ? 'edit' : 'create'})`,
    );

    return {
      ...output,
      attachments: extracted.files.map((f: ExtractedFile) => ({
        name: f.name,
        size: f.size,
        truncated: f.truncated,
      })),
      llmMs,
    };
  }

  /**
   * Streaming variant. Async generator que emite eventos `meta` -> `delta`* -> `done` ou `error`.
   * O controller plugga isso em SSE.
   */
  async *streamGenerateGraph(input: GenerateInput): AsyncGenerator<StreamEvent> {
    try {
      this.assertValidInput(input);
    } catch (err) {
      yield { type: 'error', message: (err as Error).message };
      return;
    }

    const extracted = await this.fileExtractor.extractAll(input.files);
    const context = this.fileExtractor.formatForPrompt(extracted.files);
    const attachments = extracted.files.map((f: ExtractedFile) => ({
      name: f.name,
      size: f.size,
      truncated: f.truncated,
    }));
    const mode: 'create' | 'edit' = input.existingGraph ? 'edit' : 'create';

    yield { type: 'meta', attachments, mode };

    const started = Date.now();
    const stream = this.anthropic.streamBpmn(input.prompt, context, input.existingGraph);

    // Buffer de texto pra repassar deltas via async iteration.
    // O SDK 0.95 expoe AsyncIterator de eventos brutos via `for await (const event of stream)`.
    // Filtramos apenas `content_block_delta` com text_delta.
    let fullText = '';
    try {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const chunk = event.delta.text;
          fullText += chunk;
          yield { type: 'delta', text: chunk };
        }
      }
    } catch (err) {
      yield { type: 'error', message: (err as Error).message };
      return;
    }

    try {
      const parsed = this.anthropic.parseAndValidate(fullText);
      const llmMs = Date.now() - started;
      this.logger.log(
        `Graph streamed em ${llmMs}ms (${(parsed.graph as { nodes: unknown[] }).nodes.length} nodes, ${extracted.files.length} arquivos, mode=${mode})`,
      );
      yield {
        type: 'done',
        result: { ...parsed, attachments, llmMs },
      };
    } catch (err) {
      this.logger.error(`Falha pos-stream parse/validate: ${(err as Error).message}`);
      yield { type: 'error', message: (err as Error).message };
    }
  }

  private assertValidInput(input: GenerateInput): void {
    if (!input.prompt.trim() && input.files.length === 0) {
      throw new BadRequestException('Informe um prompt OU pelo menos 1 arquivo.');
    }
  }
}
