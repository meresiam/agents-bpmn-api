import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('processes/:processId/comments')
  async findByProcess(
    @Param('processId') processId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.findByProcess(processId, user);
  }

  @Post('processes/:processId/comments')
  async create(
    @Param('processId') processId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.create(processId, dto.content, user);
  }

  @Delete('comments/:id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentsService.delete(id, user);
  }
}
