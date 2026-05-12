import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  tenantId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { tenantId?: string; role?: Role; q?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.role) where.role = filters.role;
    if (filters.q) {
      where.OR = [
        { email: { contains: filters.q, mode: 'insensitive' } },
        { name: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: [{ tenantId: 'asc' }, { name: 'asc' }],
      select: USER_SELECT,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('E-mail ja cadastrado');

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantId },
    });
    if (!tenant) {
      throw new BadRequestException(
        'Tenant inexistente. Cadastre o cliente em /admin/tenants primeiro.',
      );
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        tenantId: dto.tenantId,
        role: dto.role,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    const target = await this.findOne(id);

    // Self-protection: SUPER_ADMIN nao pode rebaixar a si mesmo
    if (target.id === actingUserId && dto.role && dto.role !== target.role) {
      throw new ForbiddenException(
        'Voce nao pode alterar seu proprio nivel de acesso.',
      );
    }

    if (dto.tenantId && dto.tenantId !== target.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: dto.tenantId },
      });
      if (!tenant) {
        throw new BadRequestException('Tenant inexistente.');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.tenantId !== undefined && { tenantId: dto.tenantId }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: USER_SELECT,
    });
  }

  async resetPassword(id: string, password: string) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(password, BCRYPT_ROUNDS) },
    });
    return { ok: true };
  }

  async delete(id: string, actingUserId: string) {
    if (id === actingUserId) {
      throw new ForbiddenException('Voce nao pode excluir o proprio usuario.');
    }
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
