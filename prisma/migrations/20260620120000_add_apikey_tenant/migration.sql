-- Wave 1 (S1.2.a) — ApiKey por tenant. Expand-contract: coluna nullable, sem
-- backfill destrutivo. Chaves existentes ficam com tenantId NULL e o guard as
-- rejeita (fail-closed) ate o seed/admin atribuir um tenant.
ALTER TABLE "api_keys" ADD COLUMN "tenantId" TEXT;

CREATE INDEX "idx_api_keys_tenant_id" ON "api_keys"("tenantId");
