import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserGroups } from "../types/enums.js";
import { Transaction } from "./transaction.entity.js";
import { TransactionForward } from "./transaction.forward.entity.js";

@Entity("Users")
export class User {
	@PrimaryColumn({
		type: "varchar",
		length: 255,
		primaryKeyConstraintName: "PK_User",
	})
	name!: string;

	@Column({ type: "text" })
	hashedPassword!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;

	@OneToMany(
		() => Transaction,
		(transaction) => transaction.creator,
	)
	createdTransactions!: TransactionForward[];

	@OneToMany(
		() => TransactionForward,
		(transactionForward) => transactionForward.sender,
	)
	sentTransactionForwards!: TransactionForward[];

	@OneToMany(
		() => TransactionForward,
		(transactionForward) => transactionForward.receiver,
	)
	receivedTransactionForwards!: TransactionForward[];

	@Column({
		type: "enum",
		enum: UserGroups,
		default: UserGroups.USER,
	})
	group!: UserGroups;
}
