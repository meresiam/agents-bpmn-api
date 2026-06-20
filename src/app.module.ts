import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthController } from './common/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ProcessesModule } from './modules/processes/processes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { StickyNotesModule } from './modules/sticky-notes/sticky-notes.module';
import { ChatModule } from './modules/chat/chat.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // S1.4.b — rate limiting global (100 req/min por IP). Limites apertados
    // em rotas sensiveis via @Throttle nos controllers (login/share/chat).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ProcessesModule,
    CommentsModule,
    PublicApiModule,
    StickyNotesModule,
    ChatModule,
    UsersModule,
    TenantsModule,
  ],
  controllers: [HealthController],
  providers: [
    // ThrottlerGuard primeiro: rate-limit antes da auth (barra brute-force no login).
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
