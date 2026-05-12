import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
