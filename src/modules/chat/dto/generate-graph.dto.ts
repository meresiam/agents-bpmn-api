import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Recebido via multipart/form-data junto com os arquivos.
 * Multer parseia campos textuais e os entrega como string no body.
 */
export class GenerateGraphDto {
  @IsString()
  @MinLength(3)
  @MaxLength(8000)
  prompt!: string;

  /** Tenant alvo. Obrigatorio pra SUPER_ADMIN; ignorado/forcado p/ tenant do user nos demais roles. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tenantId?: string;

  /** Modo de geracao: 'create' (default) ou 'edit' (requer existingGraph). */
  @IsOptional()
  @IsIn(['create', 'edit'])
  mode?: 'create' | 'edit';

  /**
   * Grafo atual em JSON (string, pq multipart nao tem campo de objeto).
   * Obrigatorio quando mode='edit'. Tamanho cap em 256KB pra evitar prompt explosion.
   */
  @IsOptional()
  @IsString()
  @MaxLength(256 * 1024)
  existingGraph?: string;

  /** ID do processo sendo editado — informativo, vai pro log. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  processId?: string;
}
