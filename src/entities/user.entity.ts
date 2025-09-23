import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import { Permission } from "./permission.entity.js";
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

	@ManyToMany(
		() => Permission,
		(permission) => permission.users,
	)
	@JoinTable({
		name: "UsersPermissions",
		joinColumn: {
			name: "user",
			referencedColumnName: "name",
		},
		inverseJoinColumn: {
			name: "permission",
			referencedColumnName: "name",
		},
	})
	permissions!: Permission[];

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
}
