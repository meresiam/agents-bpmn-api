import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Body opcional do POST /processes/:id/pair (Epic 4.A). */
export class PairProcessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug?: string;
}
