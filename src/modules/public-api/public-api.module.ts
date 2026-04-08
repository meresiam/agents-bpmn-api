import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { ProcessesModule } from '../processes/processes.module';
import { StickyNotesModule } from '../sticky-notes/sticky-notes.module';

@Module({
  imports: [ProcessesModule, StickyNotesModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
