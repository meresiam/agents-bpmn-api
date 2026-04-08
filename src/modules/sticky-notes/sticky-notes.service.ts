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

  async findByProcess(processId: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.findByProcessId(processId);
  }

  /** For public API — no user context */
  async findByProcessPublic(processId: string) {
    await this.processesService.findOneAnyTenant(processId);
    return this.repository.findByProcessId(processId);
  }

  async create(processId: string, dto: CreateStickyNoteDto, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.create({
      processId,
      content: dto.content,
      color: dto.color,
      x: dto.x,
      y: dto.y,
      ...(dto.width && { width: dto.width }),
      ...(dto.height && { height: dto.height }),
    });
  }

  /** For public API */
  async createPublic(processId: string, dto: CreateStickyNoteDto) {
    await this.processesService.findOneAnyTenant(processId);
    return this.repository.create({
      processId,
      content: dto.content,
      color: dto.color,
      x: dto.x,
      y: dto.y,
      ...(dto.width && { width: dto.width }),
      ...(dto.height && { height: dto.height }),
    });
  }

  async update(noteId: string, dto: UpdateStickyNoteDto) {
    const note = await this.repository.findById(noteId);
    if (!note) throw new NotFoundException('Sticky note nao encontrada');
    return this.repository.update(noteId, dto);
  }

  async delete(noteId: string) {
    const note = await this.repository.findById(noteId);
    if (!note) throw new NotFoundException('Sticky note nao encontrada');
    return this.repository.delete(noteId);
  }
}
