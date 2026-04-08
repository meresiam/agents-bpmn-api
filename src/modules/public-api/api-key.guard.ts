import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) throw new UnauthorizedException('API Key ausente');

    const keys = await this.prisma.apiKey.findMany({
      where: { isActive: true },
    });

    for (const stored of keys) {
      const isMatch = await bcrypt.compare(apiKey, stored.key);
      if (isMatch) return true;
    }

    throw new UnauthorizedException('API Key invalida');
  }
}
