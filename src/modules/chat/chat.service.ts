import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AnthropicClient, BpmnGenerationOutput } from './llm/anthropic.client';
import { FileExtractorService, ExtractedFile } from './files/file-extractor.service';

export interface GenerateGraphResult extends BpmnGenerationOutput {
  attachments: Array<{ name: string; size: number; truncated: boolean }>;
  llmMs: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly anthropic: AnthropicClient,
    private readonly fileExtractor: FileExtractorService,
  ) {}

  async generateGraph(
    prompt: string,
    files: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>,
  ): Promise<GenerateGraphResult> {
    if (!prompt.trim() && files.length === 0) {
      throw new BadRequestException('Informe um prompt OU pelo menos 1 arquivo.');
    }

    const extracted = await this.fileExtractor.extractAll(files);
    const context = this.fileExtractor.formatForPrompt(extracted.files);

    const started = Date.now();
    const output = await this.anthropic.generateBpmn(prompt, context);
    const llmMs = Date.now() - started;

    this.logger.log(
      `Graph gerado em ${llmMs}ms (${(output.graph as { nodes: unknown[] }).nodes.length} nodes, ${extracted.files.length} arquivos)`,
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
}
