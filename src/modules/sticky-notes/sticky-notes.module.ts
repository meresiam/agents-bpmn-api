import { Module } from '@nestjs/common';
import { StickyNotesController } from './sticky-notes.controller';
import { StickyNotesService } from './sticky-notes.service';
import { StickyNotesRepository } from './sticky-notes.repository';
import { ProcessesModule } from '../processes/processes.module';

@Module({
  imports: [ProcessesModule],
  controllers: [StickyNotesController],
  providers: [StickyNotesService, StickyNotesRepository],
  exports: [StickyNotesService],
})
export class StickyNotesModule {}
