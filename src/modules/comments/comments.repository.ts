import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProcessId(processId: string) {
    return this.prisma.comment.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  create(data: { content: string; processId: string; authorId: string }) {
    return this.prisma.comment.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  delete(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
