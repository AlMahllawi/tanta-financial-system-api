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
@Index("UniqueTransactionDocument", ["transaction", "documentURI"], {
	unique: true,
})
export class TransactionDocument {
	@PrimaryGeneratedColumn({
		primaryKeyConstraintName: "PK_TransactionDocument",
		type: "int",
	})
	id!: number;

	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.documents,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({
		foreignKeyConstraintName: "FK_TransactionDocument",
		name: "transactionId",
	})
	transaction!: Relation<Transaction>;

	@Column({ type: "text" })
	documentURI!: string;
}
