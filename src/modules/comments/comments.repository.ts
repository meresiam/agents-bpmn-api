import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findThreadsByProcessId(processId: string) {
    return this.prisma.commentThread.findMany({
      where: { processId },
      orderBy: { createdAt: 'asc' },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  findThreadById(id: string) {
    return this.prisma.commentThread.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  createThread(data: { processId: string; x: number; y: number; content: string; authorId: string }) {
    return this.prisma.commentThread.create({
      data: {
        processId: data.processId,
        x: data.x,
        y: data.y,
        comments: {
          create: {
            content: data.content,
            authorId: data.authorId,
          },
        },
      },
      include: {
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  addComment(threadId: string, content: string, authorId: string) {
    return this.prisma.comment.create({
      data: { threadId, content, authorId },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  resolveThread(id: string, resolved: boolean) {
    return this.prisma.commentThread.update({
      where: { id },
      data: { resolved },
    });
  }

  deleteThread(id: string) {
    return this.prisma.commentThread.delete({ where: { id } });
  }

  findCommentById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
