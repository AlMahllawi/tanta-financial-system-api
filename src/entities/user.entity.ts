import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { TransactionForward } from "./transaction.forward.entity.js";

@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "varchar", length: 255 })
	name!: string;

	@Column({ type: "text" })
	hashedPassword!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;

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
}
