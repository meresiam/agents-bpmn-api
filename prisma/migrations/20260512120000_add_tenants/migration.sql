-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- Backfill: cataloga tenants existentes a partir de users + processes
INSERT INTO "tenants" ("id", "slug", "name", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    t.slug,
    t.slug,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT "tenantId" AS slug FROM "users"
    UNION
    SELECT DISTINCT "tenantId" AS slug FROM "processes"
) t
WHERE t.slug IS NOT NULL AND t.slug <> ''
ON CONFLICT ("slug") DO NOTHING;
