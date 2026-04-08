import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { ProcessesService } from '../processes/processes.service';
import { UserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class CommentsService {
  constructor(
    private readonly repository: CommentsRepository,
    private readonly processesService: ProcessesService,
  ) {}

  async getThreads(processId: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.findThreadsByProcessId(processId);
  }

  async createThread(processId: string, x: number, y: number, content: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.createThread({
      processId,
      x,
      y,
      content,
      authorId: user.sub,
    });
  }

  async addComment(threadId: string, content: string, user: UserPayload) {
    const thread = await this.repository.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread nao encontrada');
    // Verify user has access to the process
    await this.processesService.findOneForUser(thread.processId, user);
    return this.repository.addComment(threadId, content, user.sub);
  }

  async resolveThread(threadId: string, resolved: boolean, user: UserPayload) {
    const thread = await this.repository.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread nao encontrada');
    await this.processesService.findOneForUser(thread.processId, user);
    return this.repository.resolveThread(threadId, resolved);
  }

  async deleteThread(threadId: string, user: UserPayload) {
    const thread = await this.repository.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread nao encontrada');
    await this.processesService.findOneForUser(thread.processId, user);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return this.repository.deleteThread(threadId);
  }

  async deleteComment(commentId: string, user: UserPayload) {
    const comment = await this.repository.findCommentById(commentId);
    if (!comment) throw new NotFoundException('Comentario nao encontrado');
    if (
      comment.authorId !== user.sub &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException();
    }
    return this.repository.deleteComment(commentId);
  }
}
