import { Injectable } from '@nestjs/common';
import { Prisma, Process } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PROCESS_LIST_SELECT = {
  id: true,
  tenantId: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  version: true,
  processKind: true,
  pairedProcessId: true,
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

  /** Carrega o processo com as duas pontas do par (AS_IS dono do FK + back-relation). */
  findByIdWithPair(id: string) {
    return this.prisma.process.findUnique({
      where: { id },
      include: { pairedProcess: true, pairedFrom: true },
    });
  }

  findByTenantAndSlug(tenantId: string, slug: string) {
    return this.prisma.process.findUnique({
      where: { uq_process_tenant_slug: { tenantId, slug } },
    });
  }

  /**
   * Cria o TO_BE e vincula ao AS_IS numa transacao.
   * Promove o processo de origem de SINGLE → AS_IS e seta o FK do par.
   * Retorna { asIs, toBe } ja atualizados.
   */
  async createPair(
    asIsId: string,
    toBe: Prisma.ProcessCreateInput,
  ): Promise<{ asIs: Process; toBe: Process }> {
    return this.prisma.$transaction(async (tx) => {
      const createdToBe = await tx.process.create({ data: toBe });
      const updatedAsIs = await tx.process.update({
        where: { id: asIsId },
        data: { processKind: 'AS_IS', pairedProcessId: createdToBe.id },
      });
      return { asIs: updatedAsIs, toBe: createdToBe };
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
