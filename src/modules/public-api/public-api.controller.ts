import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ProcessesService } from '../processes/processes.service';
import { StickyNotesService } from '../sticky-notes/sticky-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyGuard } from './api-key.guard';
import { PublicCreateProcessDto } from './dto/public-create-process.dto';
import { PublicCreateUserDto } from './dto/public-create-user.dto';
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
    private readonly prisma: PrismaService,
  ) {}

  // ─── Users ────────────────────────────────────────────────

  @Post('users')
  async createUser(@Body() dto: PublicCreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email ja cadastrado');

    const rawPassword = crypto.randomBytes(6).toString('base64url'); // ~8 chars
    const hashed = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        tenantId: dto.tenantId,
        role: dto.role || 'CLIENT',
      },
      select: { id: true, email: true, name: true, tenantId: true, role: true },
    });

    return { ...user, generatedPassword: rawPassword };
  }

  @Get('users')
  async listUsers(@Query('tenantId') tenantId?: string) {
    return this.prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: { id: true, email: true, name: true, tenantId: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

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
