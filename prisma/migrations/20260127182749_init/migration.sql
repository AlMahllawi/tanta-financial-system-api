-- CreateEnum
CREATE TYPE "UserGroups" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TransactionPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TransactionForwardStatus" AS ENUM ('WAITING', 'NEEDS_EDITING', 'REJECTED', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserGroups" NOT NULL DEFAULT 'USER',
    "lastLogin" TIMESTAMP(3),
    "departmentName" TEXT NOT NULL,

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
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploader" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fulfilled" BOOLEAN NOT NULL DEFAULT false,
    "priority" "TransactionPriority" NOT NULL DEFAULT 'LOW',
    "creator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionType" (
    "name" TEXT NOT NULL,
    "creator" TEXT NOT NULL,

    CONSTRAINT "TransactionType_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "TransactionForward" (
    "id" SERIAL NOT NULL,
    "status" "TransactionForwardStatus" NOT NULL DEFAULT 'WAITING',
    "comment" TEXT,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "forwardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "TransactionForward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttachedTo" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttachedTo_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_managerName_key" ON "Department"("managerName");

-- CreateIndex
CREATE INDEX "_AttachedTo_B_index" ON "_AttachedTo"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentName_fkey" FOREIGN KEY ("departmentName") REFERENCES "Department"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerName_fkey" FOREIGN KEY ("managerName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_type_fkey" FOREIGN KEY ("type") REFERENCES "TransactionType"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creator_fkey" FOREIGN KEY ("creator") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionType" ADD CONSTRAINT "TransactionType_creator_fkey" FOREIGN KEY ("creator") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_sender_fkey" FOREIGN KEY ("sender") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "TransactionForward_receiver_fkey" FOREIGN KEY ("receiver") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachedTo" ADD CONSTRAINT "_AttachedTo_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachedTo" ADD CONSTRAINT "_AttachedTo_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
