import { transactionTypeRepository } from "../repositories/transaction.repository.js";

export async function transactionsTypes() {
	return await transactionTypeRepository.find();
}

export const createTransactionType = transactionTypeRepository.create.bind(
	transactionTypeRepository,
);
