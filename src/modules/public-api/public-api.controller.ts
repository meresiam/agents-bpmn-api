import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProcessesService } from '../processes/processes.service';
import { ApiKeyGuard } from './api-key.guard';
import { PublicCreateProcessDto } from './dto/public-create-process.dto';
import { UpdateProcessDto } from '../processes/dto/update-process.dto';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@UseGuards(ApiKeyGuard)
@Controller('public/processes')
export class PublicApiController {
  constructor(private readonly processesService: ProcessesService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId: string) {
    return this.processesService.findAllByTenantId(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.processesService.findOneAnyTenant(id);
  }

  @Post()
  async create(@Body() dto: PublicCreateProcessDto) {
    return this.processesService.create(dto.tenantId, {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      graph: dto.graph,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProcessDto) {
    return this.processesService.updateAnyTenant(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.processesService.deleteAnyTenant(id);
  }
}
