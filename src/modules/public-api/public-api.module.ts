import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { ProcessesModule } from '../processes/processes.module';

@Module({
  imports: [ProcessesModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
