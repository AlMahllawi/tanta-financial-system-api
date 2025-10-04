import { In } from "typeorm";
import datasource from "../datasource.js";
import type { TransactionDTO } from "../dto/transaction.dto.js";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import { Transaction } from "../entities/transaction.entity.js";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { User } from "../entities/user.entity.js";
import {
	type TransactionForwardStatus,
	TransactionPriority,
} from "../types/enums.js";
import { Exceptions } from "../utils/exceptions.js";

export namespace TransactionAdaptor {
	export async function types() {
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
				`There exist a transaction type with the name: "${name}".`,
			);
		}

		return type;
	}

	export async function create(
		title: string,
		description: string,
		typeName: string,
		creatorName: string,
		priority: TransactionPriority = TransactionPriority.LOW,
	) {
		const transaction = new Transaction();

		transaction.title = title;
		transaction.description = description;

		const type = await datasource
			.getRepository(TransactionType)
			.findOneBy({ name: typeName });

		if (!type)
			throw new Exceptions.Invalid(
				`Invalid transaction type name: "${typeName}".`,
			);

		transaction.type = type;

		const creator = await datasource
			.getRepository(User)
			.findOneBy({ name: creatorName });

		if (!creator)
			throw new Exceptions.Invalid(`No user with name: "${creatorName}".`);

		transaction.creator = creator;

		transaction.priority = priority;

		return await datasource.getRepository(Transaction).save(transaction);
	}

	export async function view(id: number) {
		return await datasource.getRepository(Transaction).findOneBy({ id });
	}

	export async function viewAll(
		pageNumber: number,
		pageSize: number,
	): Promise<Transaction[]> {
		return await datasource.getRepository(Transaction).find({
			relations: ["type", "creator"],
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				id: "desc",
			},
		});
	}

	export async function createdBy(
		creatorName: string,
		pageNumber: number,
		pageSize: number,
	) {
		return await datasource.getRepository(Transaction).find({
			relations: ["type", "creator"],
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				id: "desc",
			},
			where: { creator: { name: creatorName } },
		});
	}

	export async function update(
		transactionId: number,
		updates: TransactionDTO.Updates,
	) {
		const transactionRepository = datasource.getRepository(Transaction);

		const transaction = await transactionRepository.findOneBy({
			id: transactionId,
		});

		if (!transaction)
			throw new Exceptions.Invalid(
				`Invalid transaction identifier: "${transactionId}".`,
			);

		if (updates.title !== undefined) transaction.title = updates.title;

		if (updates.description !== undefined)
			transaction.description = updates.description;

		if (updates.priority !== undefined) transaction.priority = updates.priority;

		if (updates.fulfilled !== undefined)
			transaction.fulfilled = updates.fulfilled;

		if (updates.typeName !== undefined) {
			const type = await datasource
				.getRepository(TransactionType)
				.findOne({ where: { name: updates.typeName } });

			if (!type)
				throw new Exceptions.Invalid(
					`Invalid transaction type name: "${updates.typeName}".`,
				);

			transaction.type = type;
		}

		return await transactionRepository.save(transaction);
	}

	export async function remove(id: number) {
		return (
			((await datasource.getRepository(Transaction).delete({ id })).affected ??
				1) > 0
		);
	}

	export async function attachDocument(
		transactionId: number,
		documentURI: string,
	) {
		const transactionDocument = new TransactionDocument();
		transactionDocument.transactionId = transactionId;
		transactionDocument.documentURI = documentURI;
		return await datasource
			.getRepository(TransactionDocument)
			.save(transactionDocument);
	}

	export async function detachDocument(
		transactionId: number,
		documentURI: string,
	) {
		return (
			((
				await datasource
					.getRepository(TransactionDocument)
					.delete({ transactionId, documentURI })
			).affected ?? 1) > 0
		);
	}

	export async function forward(
		transactionId: number,
		senderName: string,
		receiverName: string,
	) {
		const transactionForward = new TransactionForward();

		const transaction = await datasource.getRepository(Transaction).findOneBy({
			id: transactionId,
		});
		if (!transaction)
			throw new Exceptions.Invalid(
				`There was no transaction with the id ${transactionId}. Can't create a forward.`,
			);

		transactionForward.transaction = transaction;

		const users = await datasource.getRepository(User).findBy({
			name: In([senderName, receiverName]),
		});

		const senderUser = users.find((user) => user.name === senderName);

		if (!senderUser)
			throw new Exceptions.Invalid(
				`There was no user with the name: "${senderName}". Can't create a transaction forward.`,
			);

		transactionForward.sender = senderUser;

		const receiverUser = users.find((user) => user.name === receiverName);

		if (!receiverUser)
			throw new Exceptions.Invalid(
				`There was no user with the name: "${receiverUser}". Can't create a transaction forward.`,
			);

		transactionForward.receiver = receiverUser;

		return await datasource
			.getRepository(TransactionForward)
			.save(transactionForward);
	}

	export async function viewForwards(
		transactionId: number,
		pageNumber: number,
		pageSize: number,
	) {
		return await datasource.getRepository(TransactionForward).find({
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				id: "desc",
			},
			relations: ["sender", "receiver"],
			where: { transaction: { id: transactionId } },
		});
	}

	export async function updateForwardStatus(
		transactionId: number,
		forwardId: number,
		status: TransactionForwardStatus,
	) {
		const transactionForwardRepository =
			datasource.getRepository(TransactionForward);

		const forward = await transactionForwardRepository.findOneBy({
			id: forwardId,
			transaction: { id: transactionId },
		});

		if (!forward)
			throw new Exceptions.Invalid(
				`There was no transaction forward with the id ${forwardId}. Can't update the status.`,
			);

		forward.status = status;

		return await transactionForwardRepository.save(forward);
	}

	export async function deleteForward(
		transactionId: number,
		forwardId: number,
	) {
		return (
			((
				await datasource.getRepository(TransactionForward).delete({
					id: forwardId,
					transaction: { id: transactionId },
				})
			).affected ?? 1) > 0
		);
	}
}
