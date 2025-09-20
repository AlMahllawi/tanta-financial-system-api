import type { Relation } from "typeorm";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Transaction } from "./transaction.entity.js";

@Entity("TransactionDocuments")
export class TransactionDocument {
	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.transactionDocuments,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "transactionId" })
	transaction!: Relation<Transaction>;

	@Column({ type: "text" })
	documentURI!: string;
}
