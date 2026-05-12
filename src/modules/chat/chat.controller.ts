import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
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
   * Recebe prompt + arquivos via multipart/form-data e retorna um JSON BPMN
   * gerado pelo LLM (sem salvar no banco — preview-first).
   *
   * O frontend chama POST /processes em seguida quando o usuario aprova o preview.
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

    this.logger.log(
      `LLM generate-graph: tenant=${effectiveTenantId} user=${user.email} files=${safeFiles.length}`,
    );

    const result = await this.chatService.generateGraph(
      dto.prompt ?? '',
      safeFiles.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        buffer: f.buffer,
      })),
    );

    return {
      ...result,
      tenantId: effectiveTenantId,
    };
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
}
