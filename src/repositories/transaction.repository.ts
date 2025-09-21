import datasource from "../datasource.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { Exceptions } from "../utils/exceptions.js";

export const transactionTypeRepository = datasource
	.getRepository(TransactionType)
	.extend({
		async create(name: string) {
			await this.createQueryBuilder()
				.insert()
				.into(TransactionType)
				.values({
					name,
				})
				.execute()
				.catch((err: any) => {
					throw err.driverError?.constraint === "PK_TransactionType"
						? new Exceptions.Conflict(
								`There exist a transaction type with the name: ${name}.`,
							)
						: err;
				});
			return await this.findOneBy({ name });
		},
	});
