import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GapAnalysisService } from './gap/gap-analysis.service';
import { PopService } from './pop/pop.service';
import { PopRepository } from './pop/pop.repository';
import { AnthropicClient } from './llm/anthropic.client';
import { FileExtractorService } from './files/file-extractor.service';
import { ProcessesModule } from '../processes/processes.module';

@Module({
  imports: [ProcessesModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    GapAnalysisService,
    PopService,
    PopRepository,
    AnthropicClient,
    FileExtractorService,
  ],
})
export class ChatModule {}
