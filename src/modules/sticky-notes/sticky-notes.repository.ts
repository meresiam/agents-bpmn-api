import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StickyNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProcessId(processId: string) {
    return this.prisma.stickyNote.findMany({
      where: { processId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.stickyNote.findUnique({ where: { id } });
  }

  create(data: Prisma.StickyNoteUncheckedCreateInput) {
    return this.prisma.stickyNote.create({ data });
  }

  update(id: string, data: Prisma.StickyNoteUpdateInput) {
    return this.prisma.stickyNote.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.stickyNote.delete({ where: { id } });
  }
}
