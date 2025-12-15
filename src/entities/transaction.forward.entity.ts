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
import { TransactionForwardStatus } from "../types/enums.js";
import { Transaction } from "./transaction.entity.js";
import { User } from "./user.entity.js";

@Entity("TransactionForwards")
export class TransactionForward {
	@PrimaryGeneratedColumn({
		primaryKeyConstraintName: "PK_TransactionForward",
		type: "int",
	})
	id!: number;

	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.forwards,
		{
			onDelete: "CASCADE",
			nullable: false,
		},
	)
	@JoinColumn({
		foreignKeyConstraintName: "FK_TransactionForward",
		name: "transactionId",
	})
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
	@JoinColumn({
		name: "senderName",
		foreignKeyConstraintName: "FK_ForwardSenderName",
	})
	sender!: Relation<User>;

	@ManyToOne(
		() => User,
		(user) => user.receivedTransactionForwards,
		{
			onDelete: "RESTRICT",
			nullable: false,
		},
	)
	@JoinColumn({
		name: "receiverName",
		foreignKeyConstraintName: "FK_ForwardReceiverName",
	})
	receiver!: Relation<User>;

	@CreateDateColumn()
	forwardedAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
