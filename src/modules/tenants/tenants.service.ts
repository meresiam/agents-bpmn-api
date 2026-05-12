import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { slug: 'asc' },
    });

    const userGroups = await this.prisma.user.groupBy({
      by: ['tenantId'],
      _count: { id: true },
    });
    const userMap = new Map(
      userGroups.map((g) => [g.tenantId, g._count.id]),
    );

    const processGroups = await this.prisma.process.groupBy({
      by: ['tenantId'],
      _count: { id: true },
    });
    const processMap = new Map(
      processGroups.map((g) => [g.tenantId, g._count.id]),
    );

    return tenants.map((t) => ({
      ...t,
      userCount: userMap.get(t.slug) ?? 0,
      processCount: processMap.get(t.slug) ?? 0,
    }));
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug ja em uso');
    return this.prisma.tenant.create({
      data: { slug: dto.slug, name: dto.name },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOneOrThrow(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { ...(dto.name !== undefined && { name: dto.name }) },
    });
  }

  async delete(id: string) {
    const tenant = await this.findOneOrThrow(id);
    const userCount = await this.prisma.user.count({
      where: { tenantId: tenant.slug },
    });
    const processCount = await this.prisma.process.count({
      where: { tenantId: tenant.slug },
    });
    if (userCount > 0 || processCount > 0) {
      throw new ConflictException(
        `Tenant possui ${userCount} usuario(s) e ${processCount} processo(s) vinculados. Remova-os antes.`,
      );
    }
    await this.prisma.tenant.delete({ where: { id } });
    return { ok: true };
  }

  private async findOneOrThrow(id: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tenant nao encontrado');
    return t;
  }
}
