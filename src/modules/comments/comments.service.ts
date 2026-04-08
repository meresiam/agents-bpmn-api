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

  async findByProcess(processId: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.findByProcessId(processId);
  }

  async create(processId: string, content: string, user: UserPayload) {
    await this.processesService.findOneForUser(processId, user);
    return this.repository.create({
      content,
      processId,
      authorId: user.sub,
    });
  }

  async delete(commentId: string, user: UserPayload) {
    const comment = await this.repository.findById(commentId);
    if (!comment) throw new NotFoundException('Comentario nao encontrado');
    if (
      comment.authorId !== user.sub &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException();
    }
    return this.repository.delete(commentId);
  }
}
