import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
