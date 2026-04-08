import { IsString, IsOptional, IsObject, IsEnum, MinLength } from 'class-validator';
import { ProcessCategory } from '@prisma/client';

export class UpdateProcessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProcessCategory)
  category?: ProcessCategory;

  @IsOptional()
  @IsObject()
  graph?: Record<string, unknown>;
}
