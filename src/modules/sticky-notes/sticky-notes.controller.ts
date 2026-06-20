import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StickyNotesService } from './sticky-notes.service';
import { CreateStickyNoteDto, UpdateStickyNoteDto } from './dto/sticky-note.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller()
export class StickyNotesController {
  constructor(private readonly stickyNotesService: StickyNotesService) {}

  @Get('processes/:processId/notes')
  async findByProcess(
    @Param('processId') processId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.stickyNotesService.findByProcess(processId, user);
  }

  @Post('processes/:processId/notes')
  async create(
    @Param('processId') processId: string,
    @Body() dto: CreateStickyNoteDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.stickyNotesService.create(processId, dto, user);
  }

  @Patch('notes/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStickyNoteDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.stickyNotesService.updateForUser(id, dto, user);
  }

  @Delete('notes/:id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.stickyNotesService.deleteForUser(id, user);
  }
}
