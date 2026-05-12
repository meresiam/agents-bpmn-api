import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ChatService, StreamEvent } from './chat.service';
import { GenerateGraphDto } from './dto/generate-graph.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/generate-graph
   *
   * Modo legado (non-streaming). Recebe prompt + arquivos via multipart/form-data e
   * retorna o JSON BPMN completo de uma vez. Bloqueia ~10-15s.
   */
  @Post('generate-graph')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async generateGraph(
    @Body() dto: GenerateGraphDto,
    @UploadedFiles() files: Array<Express.Multer.File> | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const effectiveTenantId = this.resolveTenantId(user, dto.tenantId);
    const safeFiles = files ?? [];
    const existingGraph = this.parseExistingGraph(dto);

    this.logger.log(
      `LLM generate-graph: tenant=${effectiveTenantId} user=${user.email} files=${safeFiles.length} mode=${existingGraph ? 'edit' : 'create'}${dto.processId ? ' processId=' + dto.processId : ''}`,
    );

    const result = await this.chatService.generateGraph({
      prompt: dto.prompt ?? '',
      files: safeFiles.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        buffer: f.buffer,
      })),
      existingGraph,
    });

    return {
      ...result,
      tenantId: effectiveTenantId,
    };
  }

  /**
   * POST /chat/generate-graph-stream
   *
   * Streaming via SSE (Server-Sent Events). Emite eventos:
   *  - `meta`   {attachments, mode, tenantId}
   *  - `delta`  {text}      — token incremental do LLM
   *  - `done`   {result}    — graph final parseado + validado
   *  - `error`  {message}
   *
   * Cliente lê com fetch + ReadableStream (EventSource nao suporta POST multipart).
   */
  @Post('generate-graph-stream')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async generateGraphStream(
    @Body() dto: GenerateGraphDto,
    @UploadedFiles() files: Array<Express.Multer.File> | undefined,
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    const effectiveTenantId = this.resolveTenantId(user, dto.tenantId);
    const safeFiles = files ?? [];
    const existingGraph = this.parseExistingGraph(dto);

    this.logger.log(
      `LLM generate-graph-stream: tenant=${effectiveTenantId} user=${user.email} files=${safeFiles.length} mode=${existingGraph ? 'edit' : 'create'}${dto.processId ? ' processId=' + dto.processId : ''}`,
    );

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // desabilita buffer do nginx/proxy
    res.flushHeaders?.();

    const writeEvent = (event: StreamEvent) => {
      const payload: Record<string, unknown> = { ...event };
      if (event.type === 'done') {
        (payload.result as Record<string, unknown>).tenantId = effectiveTenantId;
      }
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // Heartbeat a cada 15s pra impedir corte por proxy (Coolify/CF) — desliga no end.
    const heartbeat = setInterval(() => {
      try {
        res.write(': hb\n\n');
      } catch {
        // ignored
      }
    }, 15000);

    // Aborta o stream se o cliente desconectar.
    let clientClosed = false;
    res.on('close', () => {
      clientClosed = true;
    });

    try {
      for await (const event of this.chatService.streamGenerateGraph({
        prompt: dto.prompt ?? '',
        files: safeFiles.map((f) => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          buffer: f.buffer,
        })),
        existingGraph,
      })) {
        if (clientClosed) break;
        writeEvent(event);
        if (event.type === 'done' || event.type === 'error') break;
      }
    } catch (err) {
      writeEvent({ type: 'error', message: (err as Error).message });
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  }

  private resolveTenantId(user: UserPayload, requested?: string): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!requested || !requested.trim()) {
        throw new BadRequestException(
          'SUPER_ADMIN deve informar tenantId no body (selector de cliente).',
        );
      }
      return requested.trim();
    }
    // CLIENT / ADMIN: tenantId vem da sessao, ignora o que o body mandou
    if (requested && requested !== user.tenantId) {
      throw new ForbiddenException('Voce so pode criar fluxos no seu proprio tenant.');
    }
    return user.tenantId;
  }

  private parseExistingGraph(dto: GenerateGraphDto): Record<string, unknown> | undefined {
    if (dto.mode === 'edit' && !dto.existingGraph) {
      throw new BadRequestException('mode=edit requer existingGraph no body.');
    }
    if (!dto.existingGraph) return undefined;
    try {
      const parsed = JSON.parse(dto.existingGraph);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('existingGraph nao e objeto JSON');
      }
      return parsed as Record<string, unknown>;
    } catch (err) {
      throw new BadRequestException(`existingGraph invalido: ${(err as Error).message}`);
    }
  }
}
