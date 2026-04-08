import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateThreadDto, CreateCommentDto, ResolveThreadDto } from './dto/create-comment.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /** GET /processes/:processId/threads — all threads with comments */
  @Get('processes/:processId/threads')
  async getThreads(
    @Param('processId') processId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.getThreads(processId, user);
  }

  /** POST /processes/:processId/threads — create a new thread at x,y */
  @Post('processes/:processId/threads')
  async createThread(
    @Param('processId') processId: string,
    @Body() dto: CreateThreadDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.createThread(processId, dto.x, dto.y, dto.content, user);
  }

  /** POST /threads/:threadId/comments — reply to a thread */
  @Post('threads/:threadId/comments')
  async addComment(
    @Param('threadId') threadId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.addComment(threadId, dto.content, user);
  }

  /** PATCH /threads/:threadId — resolve/unresolve */
  @Patch('threads/:threadId')
  async resolveThread(
    @Param('threadId') threadId: string,
    @Body() dto: ResolveThreadDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.resolveThread(threadId, dto.resolved ?? true, user);
  }

  /** DELETE /threads/:threadId — delete entire thread */
  @Delete('threads/:threadId')
  async deleteThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.deleteThread(threadId, user);
  }

  /** DELETE /comments/:id — delete single comment */
  @Delete('comments/:id')
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.deleteComment(id, user);
  }
}
