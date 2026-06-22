import { IsArray, IsInt, IsOptional, ArrayMaxSize } from 'class-validator';

/**
 * Body do POST /chat/pop/:popId/illustrate (Epic 6.B). `ordens` opcional: sem ela,
 * ilustra todos os passos sem imagem; com ela, (re)gera so os passos indicados.
 */
export class IllustratePopDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  ordens?: number[];
}
