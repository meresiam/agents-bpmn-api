import { IsIn, IsObject, IsOptional } from 'class-validator';

/**
 * Body do PATCH /chat/pop/:popId (Epic 6.C). content e validado/normalizado no
 * service (PopService.validate) — aqui so garantimos o shape de topo.
 */
export class UpdatePopDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['DRAFT', 'APPROVED'])
  status?: 'DRAFT' | 'APPROVED';
}
