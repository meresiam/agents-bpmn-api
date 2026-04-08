import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcessesRepository } from './processes.repository';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { UserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ProcessesService {
  constructor(private readonly repository: ProcessesRepository) {}

  private isSuperAdmin(user: UserPayload) {
    return user.role === 'SUPER_ADMIN';
  }

  async getTenants() {
    return this.repository.findTenantsSummary();
  }

  async findAllForUser(user: UserPayload) {
    if (this.isSuperAdmin(user)) {
      return this.repository.findAll();
    }
    return this.repository.findAllByTenant(user.tenantId);
  }

  async findOneForUser(id: string, user: UserPayload) {
    const process = await this.repository.findById(id);
    if (!process) throw new NotFoundException('Processo nao encontrado');
    if (!this.isSuperAdmin(user) && process.tenantId !== user.tenantId) {
      throw new ForbiddenException();
    }
    return process;
  }

  async findOne(id: string, tenantId: string) {
    const process = await this.repository.findById(id);
    if (!process) throw new NotFoundException('Processo nao encontrado');
    if (process.tenantId !== tenantId) throw new ForbiddenException();
    return process;
  }

  async findOneAnyTenant(id: string) {
    const process = await this.repository.findById(id);
    if (!process) throw new NotFoundException('Processo nao encontrado');
    return process;
  }

  async create(tenantId: string, dto: CreateProcessDto) {
    const existing = await this.repository.findByTenantAndSlug(tenantId, dto.slug);
    if (existing) throw new ConflictException('Slug ja existe para este tenant');

    return this.repository.create({
      tenantId,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      ...(dto.category && { category: dto.category }),
      graph: dto.graph as any,
    });
  }

  async update(id: string, tenantId: string, dto: UpdateProcessDto) {
    const process = await this.findOne(id, tenantId);
    return this.repository.update(process.id, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category && { category: dto.category }),
      ...(dto.graph && { graph: dto.graph as any, version: { increment: 1 } }),
    });
  }

  async updateForUser(id: string, user: UserPayload, dto: UpdateProcessDto) {
    const process = await this.findOneForUser(id, user);
    return this.repository.update(process.id, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category && { category: dto.category }),
      ...(dto.graph && { graph: dto.graph as any, version: { increment: 1 } }),
    });
  }

  async updateAnyTenant(id: string, dto: UpdateProcessDto) {
    await this.findOneAnyTenant(id);
    return this.repository.update(id, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category && { category: dto.category }),
      ...(dto.graph && { graph: dto.graph as any, version: { increment: 1 } }),
    });
  }

  async deleteForUser(id: string, user: UserPayload) {
    const process = await this.findOneForUser(id, user);
    return this.repository.delete(process.id);
  }

  async delete(id: string, tenantId: string) {
    const process = await this.findOne(id, tenantId);
    return this.repository.delete(process.id);
  }

  async deleteAnyTenant(id: string) {
    await this.findOneAnyTenant(id);
    return this.repository.delete(id);
  }

  async findAllByTenantId(tenantId: string) {
    return this.repository.findAllByTenant(tenantId);
  }
}
