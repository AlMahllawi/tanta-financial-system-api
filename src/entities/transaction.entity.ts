import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { TransactionDocument } from "./transaction.document.entity.js";
import { TransactionForward } from "./transaction.forward.entity.js";
import { TransactionType } from "./transaction.type.entity.js";

@Entity("Transactions")
export class Transaction {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "varchar", length: 255 })
	title!: string;

	@ManyToOne(
		() => TransactionType,
		(transactionType) => transactionType.transactions,
	)
	@JoinColumn({ name: "type" })
	type!: TransactionType;

	@Column({ type: "int" })
	priority!: number;

	@CreateDateColumn()
	createdAt!: Date;

	@OneToMany(
		() => TransactionDocument,
		(transactionDocument) => transactionDocument.transaction,
	)
	transactionDocuments!: TransactionDocument[];

	@OneToMany(
		() => TransactionForward,
		(transactionForward) => transactionForward.transaction,
	)
	transactionForwards!: TransactionForward[];
}
