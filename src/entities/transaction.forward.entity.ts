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
import { TransactionForwardStatus } from "../enums.js";
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

	@Column({
		type: "enum",
		enum: TransactionForwardStatus,
		default: TransactionForwardStatus.WAITING,
	})
	status!: TransactionForwardStatus;

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
