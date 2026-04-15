/*
  Warnings:

  - You are about to drop the column `output` on the `CodeBook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CodeBook" DROP COLUMN "output",
ADD COLUMN     "stderr" TEXT,
ADD COLUMN     "stdout" TEXT;
