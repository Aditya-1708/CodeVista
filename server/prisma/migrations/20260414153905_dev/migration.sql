/*
  Warnings:

  - You are about to drop the column `googleid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Problem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('JAVA', 'JAVASCRIPT', 'PYTHON', 'C', 'CPP', 'SQL');

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_problemId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_userId_fkey";

-- DropIndex
DROP INDEX "User_googleid_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleid";

-- DropTable
DROP TABLE "Problem";

-- DropTable
DROP TABLE "Submission";

-- CreateTable
CREATE TABLE "CodeBook" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Book',
    "code" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeBook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodeBook" ADD CONSTRAINT "CodeBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
