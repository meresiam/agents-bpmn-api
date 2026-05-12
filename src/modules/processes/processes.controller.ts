import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  /** GET /processes/tenants — lista clientes agrupados (SUPER_ADMIN only) */
  @Get('tenants')
  async getTenants(@CurrentUser() user: UserPayload) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    return this.processesService.getTenants();
  }

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    // SUPER_ADMIN pode filtrar por tenant via query param
    if (user.role === 'SUPER_ADMIN' && tenantId) {
      return this.processesService.findAllByTenantId(tenantId);
    }
    return this.processesService.findAllForUser(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.processesService.findOneForUser(id, user);
  }

  @Post()
  async create(
    @Body() dto: CreateProcessDto,
    @CurrentUser() user: UserPayload,
  ) {
    // SUPER_ADMIN pode criar fluxos em outro tenant (passa tenantId no body).
    // Demais roles: tenant da sessao, ignora o que veio no body.
    const targetTenant =
      user.role === 'SUPER_ADMIN' && dto.tenantId?.trim()
        ? dto.tenantId.trim()
        : user.tenantId;
    return this.processesService.create(targetTenant, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcessDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.processesService.updateForUser(id, user, dto);
  }

  /** PATCH /processes/:id/layout — save node position overrides (SUPER_ADMIN only) */
  @Patch(':id/layout')
  async updateLayout(
    @Param('id') id: string,
    @Body() body: { overrides: Record<string, { x: number; y: number }> },
    @CurrentUser() user: UserPayload,
  ) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    const process = await this.processesService.findOneForUser(id, user);
    // Merge with existing overrides
    const existing = (process.layoutOverrides as Record<string, { x: number; y: number }>) || {};
    const merged = { ...existing, ...body.overrides };
    return this.processesService.updateLayoutOverrides(id, merged);
  }

  /** DELETE /processes/:id/layout — reset all layout overrides (SUPER_ADMIN only) */
  @Delete(':id/layout')
  async resetLayout(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    return this.processesService.updateLayoutOverrides(id, null);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.processesService.deleteForUser(id, user);
  }
}
