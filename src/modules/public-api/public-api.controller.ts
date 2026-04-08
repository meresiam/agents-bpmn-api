import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProcessesService } from '../processes/processes.service';
import { StickyNotesService } from '../sticky-notes/sticky-notes.service';
import { ApiKeyGuard } from './api-key.guard';
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

  // ─── Processes ──────────────────────────────────────────────

  @Get('processes')
  async findAll(@Query('tenantId') tenantId: string) {
    return this.processesService.findAllByTenantId(tenantId);
  }

  @Get('processes/:id')
  async findOne(@Param('id') id: string) {
    return this.processesService.findOneAnyTenant(id);
  }

  @Post('processes')
  async create(@Body() dto: PublicCreateProcessDto) {
    return this.processesService.create(dto.tenantId, {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      graph: dto.graph,
    });
  }

  @Patch('processes/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateProcessDto) {
    return this.processesService.updateAnyTenant(id, dto);
  }

  @Delete('processes/:id')
  async delete(@Param('id') id: string) {
    return this.processesService.deleteAnyTenant(id);
  }

  // ─── Sticky Notes ──────────────────────────────────────────

  @Get('processes/:processId/notes')
  async getNotes(@Param('processId') processId: string) {
    return this.stickyNotesService.findByProcessPublic(processId);
  }

  @Post('processes/:processId/notes')
  async createNote(
    @Param('processId') processId: string,
    @Body() dto: CreateStickyNoteDto,
  ) {
    return this.stickyNotesService.createPublic(processId, dto);
  }

  @Patch('notes/:id')
  async updateNote(@Param('id') id: string, @Body() dto: UpdateStickyNoteDto) {
    return this.stickyNotesService.update(id, dto);
  }

  @Delete('notes/:id')
  async deleteNote(@Param('id') id: string) {
    return this.stickyNotesService.delete(id);
  }
}
