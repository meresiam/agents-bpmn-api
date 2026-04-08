/*
  Warnings:

  - You are about to drop the column `processId` on the `comments` table. All the data in the column will be lost.
  - Added the required column `threadId` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_processId_fkey";

-- DropIndex
DROP INDEX "idx_comments_process_id";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "processId",
ADD COLUMN     "threadId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "comment_threads" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_threads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_comment_threads_process_id" ON "comment_threads"("processId");

-- CreateIndex
CREATE INDEX "idx_comments_thread_id" ON "comments"("threadId");

-- AddForeignKey
ALTER TABLE "comment_threads" ADD CONSTRAINT "comment_threads_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "comment_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
