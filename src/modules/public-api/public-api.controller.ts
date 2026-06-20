import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProcessesService } from '../processes/processes.service';
import { StickyNotesService } from '../sticky-notes/sticky-notes.service';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyTenant } from './api-key-tenant.decorator';
import { PublicCreateProcessDto } from './dto/public-create-process.dto';
import { UpdateProcessDto } from '../processes/dto/update-process.dto';
import { CreateStickyNoteDto, UpdateStickyNoteDto } from '../sticky-notes/dto/sticky-note.dto';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@UseGuards(ApiKeyGuard)
@Controller('public')
export class PublicApiController {
  constructor(
    private readonly processesService: ProcessesService,
    private readonly stickyNotesService: StickyNotesService,
  ) {}

  // Endpoints de Users foram removidos da API publica (S1.2.c) — provisionamento
  // de usuario passa pelo painel /admin autenticado (SUPER_ADMIN). Menos superficie.

  // ─── Processes (escopados ao tenant da X-API-Key) ───────────

  @Get('processes')
  async findAll(@ApiKeyTenant() tenantId: string) {
    return this.processesService.findAllByTenantId(tenantId);
  }

  @Get('processes/:id')
  async findOne(@Param('id') id: string, @ApiKeyTenant() tenantId: string) {
    return this.processesService.findOne(id, tenantId);
  }

  @Post('processes')
  async create(
    @Body() dto: PublicCreateProcessDto,
    @ApiKeyTenant() tenantId: string,
  ) {
    // tenantId do body e ignorado — a chave determina o tenant (S1.2.b).
    return this.processesService.create(tenantId, {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      graph: dto.graph,
    });
  }

  @Patch('processes/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcessDto,
    @ApiKeyTenant() tenantId: string,
  ) {
    return this.processesService.update(id, tenantId, dto);
  }

  @Delete('processes/:id')
  async delete(@Param('id') id: string, @ApiKeyTenant() tenantId: string) {
    return this.processesService.delete(id, tenantId);
  }

  // ─── Sticky Notes (escopados ao tenant da X-API-Key) ────────

  @Get('processes/:processId/notes')
  async getNotes(
    @Param('processId') processId: string,
    @ApiKeyTenant() tenantId: string,
  ) {
    return this.stickyNotesService.findByProcessForTenant(processId, tenantId);
  }

  @Post('processes/:processId/notes')
  async createNote(
    @Param('processId') processId: string,
    @Body() dto: CreateStickyNoteDto,
    @ApiKeyTenant() tenantId: string,
  ) {
    return this.stickyNotesService.createForTenant(processId, dto, tenantId);
  }

  @Patch('notes/:id')
  async updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateStickyNoteDto,
    @ApiKeyTenant() tenantId: string,
  ) {
    return this.stickyNotesService.updateForTenant(id, dto, tenantId);
  }

  @Delete('notes/:id')
  async deleteNote(@Param('id') id: string, @ApiKeyTenant() tenantId: string) {
    return this.stickyNotesService.deleteForTenant(id, tenantId);
  }
}
