import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProcessesModule } from './modules/processes/processes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { StickyNotesModule } from './modules/sticky-notes/sticky-notes.module';
import { ChatModule } from './modules/chat/chat.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProcessesModule,
    CommentsModule,
    PublicApiModule,
    StickyNotesModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
