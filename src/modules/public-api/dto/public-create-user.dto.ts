import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class PublicCreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  tenantId!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
