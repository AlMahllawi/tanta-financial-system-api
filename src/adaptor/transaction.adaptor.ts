import datasource from "../datasource.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { Exceptions } from "../utils/exceptions.js";

export namespace TransactionAdaptor {
	export async function viewTypes() {
		return await datasource.getRepository(TransactionType).find();
	}

	export async function createType(name: string) {
		const type = new TransactionType();
		type.name = name;

		try {
			await datasource.getRepository(TransactionType).insert(type);
		} catch (error: any) {
			if (error.driverError?.constraint !== "PK_TransactionType") throw error;

			throw new Exceptions.Conflict(
				`There exist a transaction type with the name: ${name}.`,
			);
		}

		return type;
	}
}
