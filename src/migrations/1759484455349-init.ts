import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1759484455349 implements MigrationInterface {
	name = "Init1759484455349";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "Users" ("name" character varying(255) NOT NULL, "hashedPassword" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_User" PRIMARY KEY ("name"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."TransactionForwards_status_enum" AS ENUM('waiting', 'needs-editing', 'rejected', 'approved', 'fulfilled')`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionForwards" ("id" SERIAL NOT NULL, "status" "public"."TransactionForwards_status_enum" NOT NULL DEFAULT 'waiting', "forwardedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" integer NOT NULL, "senderId" character varying(255) NOT NULL, "receiverId" character varying(255) NOT NULL, CONSTRAINT "PK_1e952316cf059a6daf37c21e6c2" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionTypes" ("name" character varying(255) NOT NULL, CONSTRAINT "PK_TransactionType" PRIMARY KEY ("name"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."Transactions_priority_enum" AS ENUM('high', 'medium', 'low')`,
		);
		await queryRunner.query(
			`CREATE TABLE "Transactions" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "fulfilled" boolean NOT NULL DEFAULT false, "priority" "public"."Transactions_priority_enum" NOT NULL DEFAULT 'low', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying(255), "creatorName" character varying(255) NOT NULL, CONSTRAINT "PK_7761bf9766670b894ff2fdb3700" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "TransactionDocuments" ("id" SERIAL NOT NULL, "transactionId" integer NOT NULL, "documentURI" text NOT NULL, CONSTRAINT "PK_8488f8e87bde7dacf065cec4cbb" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_da02ffeccc7e9456775a52528a" ON "TransactionDocuments" ("transactionId", "documentURI") `,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_55ee1426da442ba907eccacd71f" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_ac1bfcbb0439db7985d95c5d65e" FOREIGN KEY ("senderId") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_828167d3816091e1bba66fd4e8c" FOREIGN KEY ("receiverId") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_da6e19bdc38231271d1233d55e6" FOREIGN KEY ("type") REFERENCES "TransactionTypes"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_7de4df2c396e0b5caf8d4020304" FOREIGN KEY ("creatorName") REFERENCES "Users"("name") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDocuments" ADD CONSTRAINT "FK_5af1652efbaf92c671aec181de3" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "TransactionDocuments" DROP CONSTRAINT "FK_5af1652efbaf92c671aec181de3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_7de4df2c396e0b5caf8d4020304"`,
		);
		await queryRunner.query(
			`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_da6e19bdc38231271d1233d55e6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_828167d3816091e1bba66fd4e8c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_ac1bfcbb0439db7985d95c5d65e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_55ee1426da442ba907eccacd71f"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_da02ffeccc7e9456775a52528a"`,
		);
		await queryRunner.query(`DROP TABLE "TransactionDocuments"`);
		await queryRunner.query(`DROP TABLE "Transactions"`);
		await queryRunner.query(`DROP TYPE "public"."Transactions_priority_enum"`);
		await queryRunner.query(`DROP TABLE "TransactionTypes"`);
		await queryRunner.query(`DROP TABLE "TransactionForwards"`);
		await queryRunner.query(
			`DROP TYPE "public"."TransactionForwards_status_enum"`,
		);
		await queryRunner.query(`DROP TABLE "Users"`);
	}
}
