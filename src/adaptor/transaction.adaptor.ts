import {
	type FindOptionsRelations,
	type FindOptionsSelect,
	type FindOptionsWhere,
	In,
} from "typeorm";
import datasource from "../datasource.js";
import type { DocumentDTO } from "../dto/document.dto.js";
import type { TransactionDTO } from "../dto/transaction.dto.js";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import { Transaction } from "../entities/transaction.entity.js";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import { TransactionType } from "../entities/transaction.type.entity.js";
import { User } from "../entities/user.entity.js";
import {
	TransactionForwardStatus,
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
		documentsURIs: DocumentDTO.URIs,
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

		transaction.documents = documentsURIs.map((uri) => {
			const document = new TransactionDocument();
			document.transaction = transaction;
			document.documentURI = uri;
			return document;
		});

		return await datasource.getRepository(Transaction).save(transaction);
	}

	export async function view(id: number) {
		return (
			await datasource.getRepository(Transaction).find({
				relations: { type: true, creator: true, documents: true },
				where: { id },
			})
		)[0];
	}

	export async function viewAll(
		pageNumber: number,
		pageSize: number,
		filters: {
			typeName?: string | undefined;
			fulfilled?: boolean | undefined;
			priority?: TransactionPriority | undefined;
			creatorName?: string | undefined;
			senderName?: string | undefined;
			receiverName?: string | undefined;
		}[],
	) {
		return await datasource.getRepository(Transaction).findAndCount({
			relations: { type: true, creator: true, documents: true },
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				id: "desc",
			},
			where: filters.map((filter) => {
				const options: FindOptionsWhere<Transaction> = {};
				if (filter.creatorName) options.creator = { name: filter.creatorName };
				if (filter.senderName)
					options.forwards = { sender: { name: filter.senderName } };
				if (filter.receiverName)
					options.forwards = { receiver: { name: filter.receiverName } };
				if (filter.typeName) options.type = { name: filter.typeName };
				if (filter.fulfilled) options.fulfilled = filter.fulfilled;
				if (filter.priority) options.priority = filter.priority;
				return options;
			}),
		});
	}

	export async function update(
		transactionId: number,
		updates: TransactionDTO.Updates,
	) {
		const transactionRepository = datasource.getRepository(Transaction);

		const transaction = (
			await transactionRepository.find({
				relations: { type: true, creator: true, documents: true },
				where: {
					id: transactionId,
				},
			})
		)[0];

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

	export async function creatorName(id: number) {
		const transaction = await datasource.getRepository(Transaction).findOne({
			relations: { creator: true },
			select: { creator: { name: true } },
			where: { id },
		});

		if (!transaction) return null;

		return transaction.creator.name;
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
		const transaction = await view(transactionId);

		if (!transaction)
			throw new Exceptions.Invalid(
				`There was no transaction with the id: "${transaction}". Can't proceed with the document attaching.`,
			);

		const transactionDocument = new TransactionDocument();
		transactionDocument.transaction = transaction;
		transactionDocument.documentURI = documentURI;
		try {
			return await datasource
				.getRepository(TransactionDocument)
				.save(transactionDocument);
		} catch (error: any) {
			if (error.driverError?.constraint !== "UniqueTransactionDocument")
				throw error;

			throw new Exceptions.Conflict(
				`The document "${documentURI}" is already attached to the transaction with the id: "${transactionId}".`,
			);
		}
	}

	export async function detachDocument(
		transactionId: number,
		documentURI: string,
	) {
		return (
			((
				await datasource
					.getRepository(TransactionDocument)
					.delete({ transaction: { id: transactionId }, documentURI })
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

	export async function lastForward(
		transactionId: number,
		select?: FindOptionsSelect<TransactionForward>,
		relations?: FindOptionsRelations<TransactionForward>,
	) {
		if (!relations) relations = {};
		relations.transaction = true;

		return await datasource.getRepository(TransactionForward).findOne({
			order: { id: "desc" },
			...(select ? { select } : {}),
			relations,
			where: { transaction: { id: transactionId } },
		});
	}

	export async function hasBeenForwardedTo(
		transactionId: number,
		receiverName: string,
	) {
		return (
			(await datasource.getRepository(TransactionForward).findOne({
				select: { id: true },
				relations: { transaction: true },
				where: {
					transaction: { id: transactionId },
					receiver: { name: receiverName },
				},
			})) !== null
		);
	}

	export async function viewForwards(
		transactionId: number,
		pageNumber: number,
		pageSize: number,
	) {
		return await datasource.getRepository(TransactionForward).findAndCount({
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				id: "desc",
			},
			relations: { sender: true, receiver: true },
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

		const forward = await transactionForwardRepository.findOne({
			where: { id: forwardId, transaction: { id: transactionId } },
			relations: {
				sender: true,
				receiver: true,
			},
		});

		if (!forward)
			throw new Exceptions.Invalid(
				`There was no transaction forward with the id ${forwardId}. Can't update the status.`,
			);

		forward.status = status;

		if (
			[
				TransactionForwardStatus.APPROVED,
				TransactionForwardStatus.REJECTED,
			].includes(status)
		) {
			// TODO: update transaction to be fulfilled
		}

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
