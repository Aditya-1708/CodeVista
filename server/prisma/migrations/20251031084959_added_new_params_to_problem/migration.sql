/*
  Warnings:

  - Added the required column `endsWith` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsWith` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "endsWith" TEXT NOT NULL,
ADD COLUMN     "startsWith" TEXT NOT NULL;
