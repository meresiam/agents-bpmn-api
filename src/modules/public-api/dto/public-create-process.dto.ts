import { IsString, IsOptional, IsObject, IsEnum, MinLength } from 'class-validator';
import { ProcessCategory } from '@prisma/client';

export class PublicCreateProcessDto {
  @IsString()
  @MinLength(1)
  tenantId!: string;

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
}
