import datasource from "../datasource.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { ExpectedError } from "../utils/custom.errors.js";

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
						? new ExpectedError(
								"transaction-type-exists",
								`There exist a transaction type with the name: ${name}. Can't proceed with the creation.`,
							)
						: err;
				});
			return await this.findOneBy({ name });
		},
	});
