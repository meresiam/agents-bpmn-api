import { IsString, Matches, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'slug deve conter apenas letras minusculas, numeros e hifens',
  })
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
