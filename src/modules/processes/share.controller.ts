import { Controller, Get, Param } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { Public } from '../../common/decorators/public.decorator';

/** Endpoint 100% publico — sem JWT, sem API Key */
@Public()
@Controller('share')
export class ShareController {
  constructor(private readonly processesService: ProcessesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.processesService.findOneAnyTenant(id);
  }
}
