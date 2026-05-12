import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AnthropicClient } from './llm/anthropic.client';
import { FileExtractorService } from './files/file-extractor.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AnthropicClient, FileExtractorService],
})
export class ChatModule {}
