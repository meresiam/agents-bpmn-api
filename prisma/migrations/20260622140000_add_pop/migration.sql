-- Wave 6 / Epic 6.A — POP (Procedimento Operacional Padrao) do TO-BE.
-- Aditivo puro: nova tabela + enum, zero impacto em dados existentes.

-- CreateEnum
CREATE TYPE "PopStatus" AS ENUM ('DRAFT', 'APPROVED');

-- CreateTable
CREATE TABLE "pops" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "processId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "status" "PopStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pops_tenant_id" ON "pops"("tenantId");

-- CreateIndex
CREATE INDEX "idx_pops_process_id" ON "pops"("processId");

-- AddForeignKey: apagar o processo de origem apaga seus POPs (cascade).
ALTER TABLE "pops" ADD CONSTRAINT "pops_processId_fkey"
  FOREIGN KEY ("processId") REFERENCES "processes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
