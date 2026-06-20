import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolve o tenantId da X-API-Key (injetado pelo ApiKeyGuard em request.apiKeyTenantId).
 * Toda operacao da API publica fica escopada a esse tenant (Wave 1, S1.2).
 */
export const ApiKeyTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().apiKeyTenantId;
  },
);
