import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ChatService, StreamEvent } from './chat.service';
import { GapAnalysisService } from './gap/gap-analysis.service';
import { PopService, PopContent } from './pop/pop.service';
import { PopImageService } from './pop/pop-image.service';
import { GenerateGraphDto } from './dto/generate-graph.dto';
import { AnalyzeGapDto } from './dto/analyze-gap.dto';
import { GeneratePopDto } from './dto/generate-pop.dto';
import { IllustratePopDto } from './dto/illustrate-pop.dto';
import { UpdatePopDto } from './dto/update-pop.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

// S1.4.b — chamadas LLM sao caras: teto de 10/min por IP em todo o /chat.
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly popService: PopService,
    private readonly popImageService: PopImageService,
  ) {}

  /**
   * POST /chat/analyze-gap (Epic 4.B)
   *
   * Recebe { processId } em JSON, carrega o grafo server-side (tenant-scoped) e
   * roda a analise de GAP via LLM. Retorna a lista estruturada de gaps + resumo.
   */
  @Post('analyze-gap')
  async analyzeGap(@Body() dto: AnalyzeGapDto, @CurrentUser() user: UserPayload) {
    this.logger.log(`analyze-gap: processId=${dto.processId} user=${user.email}`);
    return this.gapAnalysisService.analyzeForUser(dto.processId, user);
  }

  /**
   * POST /chat/generate-pop (Epic 6.A)
   *
   * Recebe { processId }, carrega o grafo TO-BE server-side (tenant-scoped),
   * gera o POP estruturado via LLM, persiste e retorna o POP completo.
   */
  @Post('generate-pop')
  async generatePop(@Body() dto: GeneratePopDto, @CurrentUser() user: UserPayload) {
    this.logger.log(`generate-pop: processId=${dto.processId} user=${user.email}`);
    return this.popService.generateForUser(dto.processId, user);
  }

  /**
   * GET /chat/pop/process/:processId — lista os POPs (metadados) de um processo.
   * GET /chat/pop/:popId — retorna um POP completo (com content).
   * Ambos tenant-scoped.
   */
  @Get('pop/process/:processId')
  async listPops(@Param('processId') processId: string, @CurrentUser() user: UserPayload) {
    return this.popService.listForUser(processId, user);
  }

  @Get('pop/:popId')
  async getPop(@Param('popId') popId: string, @CurrentUser() user: UserPayload) {
    return this.popService.getForUser(popId, user);
  }

  /**
   * POST /chat/pop/:popId/illustrate (Epic 6.B) — gera/regenera as ilustracoes
   * dos passos (Gemini). Sem `ordens`, ilustra os passos ainda sem imagem.
   */
  @Post('pop/:popId/illustrate')
  async illustratePop(
    @Param('popId') popId: string,
    @Body() dto: IllustratePopDto,
    @CurrentUser() user: UserPayload,
  ) {
    this.logger.log(`illustrate-pop: pop=${popId} ordens=${dto.ordens?.join(',') ?? 'all'}`);
    return this.popService.illustrateForUser(popId, user, dto.ordens);
  }

  /** PATCH /chat/pop/:popId (Epic 6.C) — edita content e/ou status do POP. */
  @Patch('pop/:popId')
  async updatePop(
    @Param('popId') popId: string,
    @Body() dto: UpdatePopDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.popService.updateForUser(popId, user, {
      content: dto.content as PopContent | undefined,
      status: dto.status,
    });
  }

  /**
   * GET /chat/pop/image/:popId/:file (Epic 6.B) — serve a imagem do volume.
   * Publico (uuid nao-enumeravel, mesmo modelo do /share) pra embed em <img>/PDF.
   * @Res() direto: modo library-specific do Nest ignora o ResponseInterceptor.
   */
  @Public()
  @SkipThrottle()
  @Get('pop/image/:popId/:file')
  async serveImage(
    @Param('popId') popId: string,
    @Param('file') file: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.popImageService.readImage(popId, file);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(buffer);
  }

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
