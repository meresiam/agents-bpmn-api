import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsString()
  @MinLength(1)
  content!: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

export class ResolveThreadDto {
  @IsOptional()
  resolved?: boolean;
}
