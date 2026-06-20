import { IsString, MinLength, MaxLength } from 'class-validator';

/** Body do POST /chat/analyze-gap (Epic 4.B). Recebe so o id; o graph e carregado server-side. */
export class AnalyzeGapDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  processId!: string;
}
