import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
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
		() => TransactionForward,
		(transactionForward) => transactionForward.sender,
	)
	sentTransactionForwards!: TransactionForward[];

	@OneToMany(
		() => TransactionForward,
		(transactionForward) => transactionForward.receiver,
	)
	receivedTransactionForwards!: TransactionForward[];

	static VisibleColumns = ["name"];
}
