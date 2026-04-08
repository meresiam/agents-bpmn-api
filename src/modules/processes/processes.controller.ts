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
    return this.processesService.create(user.tenantId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcessDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.processesService.updateForUser(id, user, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.processesService.deleteForUser(id, user);
  }
}
