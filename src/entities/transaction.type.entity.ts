import { Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Transaction } from "./transaction.entity.js";

@Entity("TransactionTypes")
export class TransactionType {
	@PrimaryColumn({
		type: "varchar",
		length: "255",
		primaryKeyConstraintName: "PK_TransactionType",
	})
	name!: string;

	@OneToMany(
		() => Transaction,
		(transaction) => transaction.type,
	)
	transactions!: Transaction[];
}
