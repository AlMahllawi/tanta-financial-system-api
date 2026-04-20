-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "TransactionPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TransactionForwardStatus" AS ENUM ('WAITING', 'NEEDS_EDITING', 'REJECTED', 'APPROVED');

-- CreateTable
CREATE TABLE "Department" (
    "name" TEXT NOT NULL,
    "managerId" INTEGER,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "uploaderId" INTEGER NOT NULL,
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
    "budgetName" TEXT,
    "budgetAllocation" DOUBLE PRECISION,
    "creatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDocument" (
    "transactionId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "attachedBy" INTEGER NOT NULL,
    "attachedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_transaction_document" PRIMARY KEY ("transactionId","documentId")
);

-- CreateTable
CREATE TABLE "TransactionType" (
    "name" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "TransactionType_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "TransactionForward" (
    "id" SERIAL NOT NULL,
    "status" "TransactionForwardStatus" NOT NULL DEFAULT 'WAITING',
    "senderComment" TEXT,
    "receiverComment" TEXT,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "senderSeen" BOOLEAN NOT NULL DEFAULT true,
    "receiverSeen" BOOLEAN NOT NULL DEFAULT false,
    "forwardedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "TransactionForward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "name" TEXT NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "BudgetEntry" (
    "id" SERIAL NOT NULL,
    "inputterId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "budgetName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_department_manager" ON "Department"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_name" ON "User"("name");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "fk_department_manager" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "fk_user_department" FOREIGN KEY ("departmentName") REFERENCES "Department"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_document_uploader" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "fk_transaction_type" FOREIGN KEY ("typeName") REFERENCES "TransactionType"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "fk_transaction_creator" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "fk_transaction_budget" FOREIGN KEY ("budgetName") REFERENCES "BudgetCategory"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "fk_transaction_document" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "fk_document_transaction" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "fk_transaction_document_attacher" FOREIGN KEY ("attachedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionType" ADD CONSTRAINT "fk_transaction_type_creator" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "fk_transaction_forward" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "fk_transaction_forward_sender" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForward" ADD CONSTRAINT "fk_transaction_forward_receiver" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEntry" ADD CONSTRAINT "fk_budget_entry_inputter" FOREIGN KEY ("inputterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEntry" ADD CONSTRAINT "fk_budget_entry" FOREIGN KEY ("budgetName") REFERENCES "BudgetCategory"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddView
CREATE OR REPLACE VIEW "TransactionLatestForward" AS
SELECT DISTINCT ON ("transactionId")
  "id",
  "status",
  "senderId",
  "receiverId",
  "transactionId"
FROM "TransactionForward"
ORDER BY "transactionId", "id" DESC;

-- AddView
CREATE OR REPLACE VIEW "BudgetCategoryDetails" AS
SELECT 
  c."name" AS "budgetName",
  COALESCE(e."budget", 0) AS "budget",
  COALESCE(t."allocated", 0) AS "allocated",
  COALESCE(e."budget", 0) - COALESCE(t."allocated", 0) AS "available"
FROM "BudgetCategory" c
LEFT JOIN (
  SELECT "budgetName", SUM("amount") AS "budget"
  FROM "BudgetEntry"
  GROUP BY "budgetName"
) e ON c."name" = e."budgetName"
LEFT JOIN (
  SELECT "budgetName", SUM("budgetAllocation") AS "allocated"
  FROM "Transaction"
  WHERE "fulfilled" = true AND "budgetAllocation" IS NOT NULL
  GROUP BY "budgetName"
) t ON c."name" = t."budgetName";
