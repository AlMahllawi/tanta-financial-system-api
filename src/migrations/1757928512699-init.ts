import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1757928512699 implements MigrationInterface {
    name = 'Init1757928512699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TransactionDocuments" ("id" SERIAL NOT NULL, "documentURI" text NOT NULL, "transactionId" integer, CONSTRAINT "PK_8488f8e87bde7dacf065cec4cbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "hashedPassword" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TransactionForwards" ("id" SERIAL NOT NULL, "status" integer NOT NULL, "forwardedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" integer NOT NULL, "senderId" integer NOT NULL, "receiverId" integer NOT NULL, CONSTRAINT "PK_1e952316cf059a6daf37c21e6c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TransactionTypes" ("name" character varying(255) NOT NULL, CONSTRAINT "PK_fb2d96b90646fe5dcdcd53bf6ed" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE TABLE "Transactions" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "priority" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying(255), CONSTRAINT "PK_7761bf9766670b894ff2fdb3700" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "TransactionDocuments" ADD CONSTRAINT "FK_5af1652efbaf92c671aec181de3" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_55ee1426da442ba907eccacd71f" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_ac1bfcbb0439db7985d95c5d65e" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" ADD CONSTRAINT "FK_828167d3816091e1bba66fd4e8c" FOREIGN KEY ("receiverId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_da6e19bdc38231271d1233d55e6" FOREIGN KEY ("type") REFERENCES "TransactionTypes"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_da6e19bdc38231271d1233d55e6"`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_828167d3816091e1bba66fd4e8c"`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_ac1bfcbb0439db7985d95c5d65e"`);
        await queryRunner.query(`ALTER TABLE "TransactionForwards" DROP CONSTRAINT "FK_55ee1426da442ba907eccacd71f"`);
        await queryRunner.query(`ALTER TABLE "TransactionDocuments" DROP CONSTRAINT "FK_5af1652efbaf92c671aec181de3"`);
        await queryRunner.query(`DROP TABLE "Transactions"`);
        await queryRunner.query(`DROP TABLE "TransactionTypes"`);
        await queryRunner.query(`DROP TABLE "TransactionForwards"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TABLE "TransactionDocuments"`);
    }

}
