import type { MigrationInterface, QueryRunner } from "typeorm";

export class ForwardUser1760699926144 implements MigrationInterface {
	name = "ForwardUser1760699926144";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME COLUMN "senderId" TO "senderName"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME COLUMN "receiverId" TO "receiverName"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME CONSTRAINT "FK_ac1bfcbb0439db7985d95c5d65e" TO "FK_ForwardSenderName"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME CONSTRAINT "FK_828167d3816091e1bba66fd4e8c" TO "FK_ForwardReceiverName"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME COLUMN "senderName" TO "senderId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME COLUMN "receiverName" TO "receiverId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME CONSTRAINT "FK_ForwardSenderName" TO "FK_ac1bfcbb0439db7985d95c5d65e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionForwards" RENAME CONSTRAINT "FK_ForwardReceiverName" TO "FK_828167d3816091e1bba66fd4e8c"`,
		);
	}
}
