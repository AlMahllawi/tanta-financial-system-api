import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	type Relation,
} from "typeorm";
import { TransactionPriority } from "../types/enums.js";
import { TransactionDocument } from "./transaction.document.entity.js";
import { TransactionForward } from "./transaction.forward.entity.js";
import { TransactionType } from "./transaction.type.entity.js";
import { User } from "./user.entity.js";

@Entity("Transactions")
export class Transaction {
	@PrimaryGeneratedColumn({ type: "int" })
	id!: number;

	@Column({ type: "varchar", length: 255 })
	title!: string;

	@Column({ type: "text" })
	description!: string;

	@ManyToOne(
		() => TransactionType,
		(transactionType) => transactionType.transactions,
	)
	@JoinColumn({ name: "type" })
	type!: TransactionType;

	@Column({
		type: "boolean",
		default: false,
	})
	fulfilled: boolean = false;

	@Column({
		type: "enum",
		enum: TransactionPriority,
		default: TransactionPriority.LOW,
	})
	priority!: TransactionPriority;

	@ManyToOne(
		() => User,
		(user) => user.createdTransactions,
		{
			onDelete: "RESTRICT",
			nullable: false,
		},
	)
	@JoinColumn({ name: "creatorName" })
	creator!: Relation<User>;

	@CreateDateColumn()
	createdAt!: Date;

	@OneToMany(
		() => TransactionDocument,
		(transactionDocument) => transactionDocument.transaction,
		{ cascade: true },
	)
	documents!: TransactionDocument[];

	@OneToMany(
		() => TransactionForward,
		(transactionForward) => transactionForward.transaction,
	)
	forwards!: TransactionForward[];
}
