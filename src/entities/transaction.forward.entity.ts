import type { Relation } from "typeorm";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Transaction } from "./transaction.entity.js";
import { User } from "./user.entity.js";

@Entity("TransactionForwards")
export class TransactionForward {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.transactionForwards,
		{
			onDelete: "CASCADE",
			nullable: false,
		},
	)
	@JoinColumn({ name: "transactionId" })
	transaction!: Relation<Transaction>;

	@Column({ type: "int" })
	status!: number;

	@ManyToOne(
		() => User,
		(user) => user.sentTransactionForwards,
		{
			onDelete: "RESTRICT",
			nullable: false,
		},
	)
	@JoinColumn({ name: "senderId" })
	sender!: Relation<User>;

	@ManyToOne(
		() => User,
		(user) => user.receivedTransactionForwards,
		{
			onDelete: "RESTRICT",
			nullable: false,
		},
	)
	@JoinColumn({ name: "receiverId" })
	receiver!: Relation<User>;

	@CreateDateColumn()
	forwardedAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
