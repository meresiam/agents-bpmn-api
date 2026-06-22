import { Injectable } from '@nestjs/common';
import { Prisma, Pop } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const POP_LIST_SELECT = {
  id: true,
  tenantId: true,
  processId: true,
  version: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PopRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PopUncheckedCreateInput): Promise<Pop> {
    return this.prisma.pop.create({ data });
  }

  /** Maior version ja existente pra um processo (0 se nao houver POP ainda). */
  async maxVersion(processId: string): Promise<number> {
    const latest = await this.prisma.pop.findFirst({
      where: { processId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return latest?.version ?? 0;
  }

  /** Lista os POPs de um processo (mais novo primeiro), sem o content pesado. */
  findManyByProcess(processId: string) {
    return this.prisma.pop.findMany({
      where: { processId },
      orderBy: { version: 'desc' },
      select: POP_LIST_SELECT,
    });
  }

  findById(id: string): Promise<Pop | null> {
    return this.prisma.pop.findUnique({ where: { id } });
  }
}
