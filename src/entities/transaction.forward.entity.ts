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

/**
 * TODO
 * create a constraint to ensure that:
 * - no forward is inserted unless last receiver has fulfilled the last forward (or the are no forwards).
 * - the sender of the new forward must be the last receiver
 */

@Entity("TransactionForwards")
export class TransactionForward {
	@PrimaryGeneratedColumn({ type: "int" })
	id!: number;

	@ManyToOne(
		() => Transaction,
		(transaction) => transaction.forwards,
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
