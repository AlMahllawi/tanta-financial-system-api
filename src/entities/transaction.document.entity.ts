import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	type Relation,
} from "typeorm";
import { Transaction } from "./transaction.entity.js";

@Entity("TransactionDocuments")
@Index(["transactionId", "documentURI"], { unique: true })
export class TransactionDocument {
	@PrimaryGeneratedColumn({ type: "int" })
	id!: number;

	@Column({ type: "int" })
	transactionId!: number;

	@Column({ type: "text" })
	documentURI!: string;

	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.documents,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn()
	transaction!: Relation<Transaction>;
}
