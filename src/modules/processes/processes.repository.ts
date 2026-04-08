import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PROCESS_LIST_SELECT = {
  id: true,
  tenantId: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ProcessesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.process.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: PROCESS_LIST_SELECT,
    });
  }

  findAll() {
    return this.prisma.process.findMany({
      orderBy: [{ tenantId: 'asc' }, { updatedAt: 'desc' }],
      select: PROCESS_LIST_SELECT,
    });
  }

  /** Returns distinct tenantIds with process count */
  async findTenantsSummary() {
    const results = await this.prisma.process.groupBy({
      by: ['tenantId'],
      _count: { id: true },
      orderBy: { tenantId: 'asc' },
    });
    return results.map((r) => ({
      tenantId: r.tenantId,
      processCount: r._count.id,
    }));
  }

  findById(id: string) {
    return this.prisma.process.findUnique({ where: { id } });
  }

  findByTenantAndSlug(tenantId: string, slug: string) {
    return this.prisma.process.findUnique({
      where: { uq_process_tenant_slug: { tenantId, slug } },
    });
  }

  create(data: Prisma.ProcessCreateInput) {
    return this.prisma.process.create({ data });
  }

  update(id: string, data: Prisma.ProcessUpdateInput) {
    return this.prisma.process.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.process.delete({ where: { id } });
  }
}
