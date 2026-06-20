import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProcessesService } from './processes.service';
import { Public } from '../../common/decorators/public.decorator';

/** Endpoint 100% publico — sem JWT, sem API Key */
// S1.4.b — rota publica sem auth: teto de 30/min por IP.
@Throttle({ default: { ttl: 60000, limit: 30 } })
@Public()
@Controller('share')
export class ShareController {
  constructor(private readonly processesService: ProcessesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.processesService.findOneAnyTenant(id);
  }
}
