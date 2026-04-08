import { Module } from '@nestjs/common';
import { ProcessesController } from './processes.controller';
import { ShareController } from './share.controller';
import { ProcessesService } from './processes.service';
import { ProcessesRepository } from './processes.repository';

@Module({
  controllers: [ProcessesController, ShareController],
  providers: [ProcessesService, ProcessesRepository],
  exports: [ProcessesService],
})
export class ProcessesModule {}
