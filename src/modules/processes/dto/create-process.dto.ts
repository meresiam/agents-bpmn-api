import { IsString, IsOptional, IsObject, IsEnum, MinLength } from 'class-validator';
import { ProcessCategory } from '@prisma/client';

export class CreateProcessDto {
  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProcessCategory)
  category?: ProcessCategory;

  @IsObject()
  graph!: Record<string, unknown>;

  /** Aceito apenas quando o caller for SUPER_ADMIN; demais roles tem tenant fixo da sessao. */
  @IsOptional()
  @IsString()
  tenantId?: string;
}
