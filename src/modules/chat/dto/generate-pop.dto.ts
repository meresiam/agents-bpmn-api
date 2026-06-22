import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Body do POST /chat/generate-pop (Epic 6.A). Recebe so o id do processo; o graph
 * TO-BE e carregado server-side (tenant-scoped), nunca confiando em graph do body.
 */
export class GeneratePopDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  processId!: string;
}
