import { Injectable, NotFoundException } from '@nestjs/common';
import { StickyNotesRepository } from './sticky-notes.repository';
import { ProcessesService } from '../processes/processes.service';
import { UserPayload } from '../../common/decorators/current-user.decorator';
import { CreateStickyNoteDto, UpdateStickyNoteDto } from './dto/sticky-note.dto';

@Injectable()
export class StickyNotesService {
  constructor(
    private readonly repository: StickyNotesRepository,
    private readonly processesService: ProcessesService,
  ) {}

  // ─── Autenticado (JWT) — isolamento via findOneForUser ──────

  async findByProcess(processId: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.findByProcessId(processId);
  }

  async create(processId: string, dto: CreateStickyNoteDto, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.create(this.buildCreateData(processId, dto));
  }

  async updateForUser(noteId: string, dto: UpdateStickyNoteDto, user: UserPayload) {
    const note = await this.requireNote(noteId);
    await this.processesService.findOneForUser(note.processId, user);
    return this.repository.update(noteId, dto);
  }

  async deleteForUser(noteId: string, user: UserPayload) {
    const note = await this.requireNote(noteId);
    await this.processesService.findOneForUser(note.processId, user);
    return this.repository.delete(noteId);
  }

  // ─── API publica (X-API-Key) — isolamento via tenant da chave ──

  async findByProcessForTenant(processId: string, tenantId: string) {
    await this.processesService.findOne(processId, tenantId);
    return this.repository.findByProcessId(processId);
  }

  async createForTenant(processId: string, dto: CreateStickyNoteDto, tenantId: string) {
    await this.processesService.findOne(processId, tenantId);
    return this.repository.create(this.buildCreateData(processId, dto));
  }

  async updateForTenant(noteId: string, dto: UpdateStickyNoteDto, tenantId: string) {
    const note = await this.requireNote(noteId);
    await this.processesService.findOne(note.processId, tenantId);
    return this.repository.update(noteId, dto);
  }

  async deleteForTenant(noteId: string, tenantId: string) {
    const note = await this.requireNote(noteId);
    await this.processesService.findOne(note.processId, tenantId);
    return this.repository.delete(noteId);
  }

  // ─── Helpers ────────────────────────────────────────────────

  private async requireNote(noteId: string) {
    const note = await this.repository.findById(noteId);
    if (!note) throw new NotFoundException('Sticky note nao encontrada');
    return note;
  }

  private buildCreateData(processId: string, dto: CreateStickyNoteDto) {
    return {
      processId,
      content: dto.content,
      color: dto.color,
      x: dto.x,
      y: dto.y,
      ...(dto.width && { width: dto.width }),
      ...(dto.height && { height: dto.height }),
    };
  }
}
