-- CreateEnum
CREATE TYPE "NoteColor" AS ENUM ('YELLOW', 'BLUE', 'GREEN', 'PINK', 'ORANGE', 'PURPLE');

-- CreateTable
CREATE TABLE "sticky_notes" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" "NoteColor" NOT NULL DEFAULT 'YELLOW',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticky_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sticky_notes_process_id" ON "sticky_notes"("processId");

-- AddForeignKey
ALTER TABLE "sticky_notes" ADD CONSTRAINT "sticky_notes_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
