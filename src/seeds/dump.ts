import random from "random";
import type { DataSource } from "typeorm";
import type { Seeder, SeederFactoryManager } from "typeorm-extension";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import { Transaction } from "../entities/transaction.entity.js";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { User } from "../entities/user.entity.js";

export class Dump implements Seeder {
	track = false;

	public async run(
		dataSource: DataSource,
		factoryManager: SeederFactoryManager,
	): Promise<any> {
		const userFactory = await factoryManager.get(User);
		const users = await userFactory.saveMany(15);

		const transactionTypeFactory = await factoryManager.get(TransactionType);
		const types = await transactionTypeFactory.saveMany(10);

		const transactions: Transaction[] = [];

		const transactionFactory = await factoryManager.get(Transaction);
		const transactionDocumentFactory =
			await factoryManager.get(TransactionDocument);

		for await (const user of users) {
			const selectedTypes = random.sample(
				types,
				random.int(1, types.length - 1),
			);
			for await (const type of selectedTypes) {
				transactionFactory.setMeta({ creator: user, type });
				const transaction = await transactionFactory.save();
				transactions.push(transaction);
				transactionDocumentFactory.setMeta({
					transactionId: transaction.id,
					uploader: user,
				});
				await transactionDocumentFactory.save();
			}
		}

		const transactionForwardFactory =
			await factoryManager.get(TransactionForward);
		for await (const transaction of transactions) {
			const forwardLine = random.sample(users, random.integer(1, 9));
			forwardLine.unshift(transaction.creator);
			for (let i = 1; i < forwardLine.length; i++)
				await transactionForwardFactory.save({
					transaction,
					sender: forwardLine[i - 1] as User,
					receiver: forwardLine[i] as User,
				});
		}
	}
}
