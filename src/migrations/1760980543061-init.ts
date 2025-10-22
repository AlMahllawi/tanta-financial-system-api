import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1760980543061 implements MigrationInterface {
	name = "Init1760980543061";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."Users_group_enum" AS ENUM('admin', 'user')`,
		);
		await queryRunner.query(
			`CREATE TABLE "Users" ("name" character varying(255) NOT NULL, "hashedPassword" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "group" "public"."Users_group_enum" NOT NULL DEFAULT 'user', CONSTRAINT "PK_User" PRIMARY KEY ("name"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."TransactionForwards_status_enum" AS ENUM('waiting', 'needs-editing', 'rejected', 'approved', 'fulfilled')`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionForwards" ("id" SERIAL NOT NULL, "status" "public"."TransactionForwards_status_enum" NOT NULL DEFAULT 'waiting', "forwardedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" integer NOT NULL, "senderName" character varying(255) NOT NULL, "receiverName" character varying(255) NOT NULL, CONSTRAINT "PK_TransactionForward" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionTypes" ("name" character varying(255) NOT NULL, CONSTRAINT "PK_TransactionType" PRIMARY KEY ("name"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."Transactions_priority_enum" AS ENUM('high', 'medium', 'low')`,
		);
		await queryRunner.query(
			`CREATE TABLE "Transactions" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "fulfilled" boolean NOT NULL DEFAULT false, "priority" "public"."Transactions_priority_enum" NOT NULL DEFAULT 'low', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying(255), "creatorName" character varying(255) NOT NULL, CONSTRAINT "PK_Transaction" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionDocuments" ("id" SERIAL NOT NULL, "documentURI" text NOT NULL, "transactionId" integer, CONSTRAINT "PK_TransactionDocument" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UniqueTransactionDocument" ON "TransactionDocuments" ("transactionId", "documentURI") `,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_TransactionForward" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_ForwardSenderName" FOREIGN KEY ("senderName") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_ForwardReceiverName" FOREIGN KEY ("receiverName") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_TransactionType" FOREIGN KEY ("type") REFERENCES "TransactionTypes"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_TransactionCreator" FOREIGN KEY ("creatorName") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDocuments" ADD CONSTRAINT "FK_TransactionDocument" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "TransactionDocuments" DROP CONSTRAINT "FK_TransactionDocument"`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_TransactionCreator"`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_TransactionType"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_ForwardReceiverName"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_ForwardSenderName"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_TransactionForward"`,
		);
		await queryRunner.query(`DROP INDEX "public"."UniqueTransactionDocument"`);
		await queryRunner.query(`DROP TABLE "TransactionDocuments"`);
		await queryRunner.query(`DROP TABLE "Transactions"`);
		await queryRunner.query(`DROP TYPE "public"."Transactions_priority_enum"`);
		await queryRunner.query(`DROP TABLE "TransactionTypes"`);
		await queryRunner.query(`DROP TABLE "TransactionForwards"`);
		await queryRunner.query(
			`DROP TYPE "public"."TransactionForwards_status_enum"`,
		);
		await queryRunner.query(`DROP TABLE "Users"`);
		await queryRunner.query(`DROP TYPE "public"."Users_group_enum"`);
	}
}
