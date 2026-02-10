-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TransactionPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TransactionForwardStatus" AS ENUM ('WAITING', 'NEEDS_EDITING', 'REJECTED', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Department" (
    "name" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "uploaderName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "fulfilled" BOOLEAN NOT NULL DEFAULT false,
    "priority" "TransactionPriority" NOT NULL DEFAULT 'LOW',
    "creatorName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionType" (
    "name" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,

    CONSTRAINT "TransactionType_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "TransactionForward" (
    "id" SERIAL NOT NULL,
    "status" "TransactionForwardStatus" NOT NULL DEFAULT 'WAITING',
    "senderComment" TEXT,
    "receiverComment" TEXT,
    "senderName" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "forwardedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "TransactionForward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDocument" (
    "transactionId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "attachedBy" TEXT NOT NULL,
    "attachedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionDocument_pkey" PRIMARY KEY ("transactionId","documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_managerName_key" ON "Department"("managerName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentName_fkey" FOREIGN KEY ("departmentName") REFERENCES "Department"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerName_fkey" FOREIGN KEY ("managerName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderName_fkey" FOREIGN KEY ("uploaderName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_typeName_fkey" FOREIGN KEY ("typeName") REFERENCES "TransactionType"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionType" ADD CONSTRAINT "TransactionType_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_senderName_fkey" FOREIGN KEY ("senderName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_receiverName_fkey" FOREIGN KEY ("receiverName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_attachedBy_fkey" FOREIGN KEY ("attachedBy") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
