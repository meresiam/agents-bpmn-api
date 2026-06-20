-- Wave 4 / Epic 4.A — pareamento AS-IS / TO-BE (expand-contract, nao-quebra)

-- CreateEnum
CREATE TYPE "ProcessKind" AS ENUM ('SINGLE', 'AS_IS', 'TO_BE');

-- AlterTable: processos existentes assumem SINGLE (default), pairedProcessId NULL
ALTER TABLE "processes" ADD COLUMN "processKind" "ProcessKind" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "processes" ADD COLUMN "pairedProcessId" TEXT;

-- CreateIndex: 1:1 garante que um AS_IS aponta pra no maximo um TO_BE
CREATE UNIQUE INDEX "processes_pairedProcessId_key" ON "processes"("pairedProcessId");

-- AddForeignKey: self-relation; apagar uma face apenas desfaz o vinculo (sem cascade destrutivo)
ALTER TABLE "processes" ADD CONSTRAINT "processes_pairedProcessId_fkey"
  FOREIGN KEY ("pairedProcessId") REFERENCES "processes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
