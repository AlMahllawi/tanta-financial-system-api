import random from "random";
import { setSeederFactory } from "typeorm-extension";
import { Transaction } from "../entities/transaction.entity.js";
import type { TransactionType } from "../entities/transaction.type.entity.js";
import type { User } from "../entities/user.entity.js";
import { TransactionPriority } from "../types/enums.js";

const priorities = Object.values(TransactionPriority);

export default setSeederFactory(
	Transaction,
	(faker, meta: { creator: User; type: TransactionType }) => {
		const transaction = new Transaction();
		transaction.title = `${meta.type.name} by ${meta.creator.name}`;
		transaction.description = faker.finance.transactionDescription();
		transaction.type = meta.type;
		transaction.fulfilled = random.boolean();
		transaction.priority = random.choice(priorities) as TransactionPriority;
		transaction.creator = meta.creator;
		return transaction;
	},
);
