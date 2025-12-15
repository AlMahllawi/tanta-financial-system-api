import type { Request, Response } from "express";
import { TransactionAdaptor } from "../adaptor/transaction.adaptor.js";
import { TransactionDTO } from "../dto/transaction.dto.js";
import { UtilsDTO } from "../dto/utils.dto.js";
import { UserGroups } from "../types/enums.js";
import { assertAuthenticatedRequest } from "../types/guard.js";
import { Exceptions } from "../utils/exceptions.js";

export async function viewTransactionTypes(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const transactionTypes = await TransactionAdaptor.types();

	res.status(200).json({ status: "success", transactionTypes });
}

export async function createTransactionType(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name } = TransactionDTO.TypeCreationSchema.parse(req.body);
	try {
		const transactionType = await TransactionAdaptor.createType(name);
		res.status(201).json({
			status: "success",
			transactionType: TransactionDTO.TypeViewSchema.parse(transactionType),
		});
	} catch (error: unknown) {
		if (!(error instanceof Exceptions.Conflict)) throw error;

		res.status(409).json({ status: "conflict", message: error.message });
	}
}

export async function createTransaction(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { title, description, typeName, priority, documentsURIs } =
		TransactionDTO.CreationSchema.parse(req.body);

	const transaction = await TransactionAdaptor.create(
		title,
		description,
		typeName,
		req.user.name,
		priority,
		documentsURIs,
	);

	res.status(201).json({
		status: "success",
		transaction: TransactionDTO.ViewSchema.parse(transaction),
	});
}

export async function viewTransactions(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { pageNumber, pageSize, ...filter } = UtilsDTO.Paging.extend(
		TransactionDTO.FilterSchema.shape,
	).parse(req.query);

	const userFilter = [
		filter.creatorName,
		filter.senderName,
		filter.receiverName,
	];

	const viewingNonPossessive = userFilter.some(
		(name) => name && name !== req.user.name,
	);

	const viewingAll = userFilter.every((name) => name === undefined);

	if (
		(viewingNonPossessive || viewingAll) &&
		req.user.group !== UserGroups.ADMIN
	)
		return res.status(403).json({
			status: "forbidden",
			message: "Missing access to view the transactions.",
		});

	const [transactions, totalTransactions] = await TransactionAdaptor.viewAll(
		pageNumber,
		pageSize,
		[filter],
	);

	res.status(200).json({
		status: "success",
		page: {
			number: pageNumber,
			size: pageSize,
			last: Math.ceil(totalTransactions / pageSize),
		},
		transactions: transactions.map((t) => TransactionDTO.ViewSchema.parse(t)),
	});
}

// TODO: document in postman
export async function viewTransactionsInbox(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { pageNumber, pageSize, ...filter } = UtilsDTO.Paging.extend(
		TransactionDTO.FilterSchema.shape,
	).parse(req.query);

	const userFilter = [
		filter.creatorName,
		filter.senderName,
		filter.receiverName,
	];

	const viewingNonPossessive = userFilter.some(
		(name) => name && name !== req.user.name,
	);

	const involved = userFilter.some((name) => name === req.user.name);

	if (viewingNonPossessive && !involved)
		return res.status(403).json({
			status: "forbidden",
			message: "Missing access to view the transactions.",
		});

	const filters = involved
		? [filter]
		: [
				{ ...filter, creatorName: req.user.name },
				{ ...filter, senderName: req.user.name },
				{ ...filter, receiverName: req.user.name },
			];

	const [transactions, totalTransactions] = await TransactionAdaptor.viewAll(
		pageNumber,
		pageSize,
		filters,
	);

	res.status(200).json({
		status: "success",
		page: {
			number: pageNumber,
			size: pageSize,
			last: Math.ceil(totalTransactions / pageSize),
		},
		transactions: transactions.map((t) => TransactionDTO.ViewSchema.parse(t)),
	});
}

export async function viewTransaction(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id } = TransactionDTO.TargetSchema.parse(req.params);

	const transaction = await TransactionAdaptor.view(id);
	if (!transaction)
		return res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});

	if (
		req.user.name !== transaction.creator.name &&
		req.user.group !== UserGroups.ADMIN &&
		!(await TransactionAdaptor.hasBeenForwardedTo(
			transaction.id,
			req.user.name,
		))
	)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to the transaction with the id: "${id}".`,
		});

	res.status(200).json({
		status: "success",
		transaction: TransactionDTO.ViewSchema.parse(transaction),
	});
}

export async function updateTransaction(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id } = TransactionDTO.TargetSchema.parse(req.params);
	const updates = TransactionDTO.UpdatesSchema.parse(req.body);

	const creatorName = await TransactionAdaptor.creatorName(id);

	if (!creatorName)
		return res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});

	if (req.user.name !== creatorName && req.user.group !== UserGroups.ADMIN)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to update the transaction with the id: "${id}".`,
		});

	const updatedTransaction = await TransactionAdaptor.update(id, updates);

	res.status(200).json({
		status: "success",
		updatedTransaction: TransactionDTO.ViewSchema.parse(updatedTransaction),
	});
}

export async function deleteTransaction(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id } = TransactionDTO.TargetSchema.parse(req.params);

	const creatorName = await TransactionAdaptor.creatorName(id);

	if (!creatorName)
		return res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});

	if (req.user.name !== creatorName && req.user.group !== UserGroups.ADMIN)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to delete the transaction with the id: "${id}".`,
		});

	const deleted = await TransactionAdaptor.remove(id);
	if (deleted)
		res.status(200).json({ status: "success", deleted: { transactionId: id } });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});
}

async function getLastReceiverName(id: number) {
	return (
		await TransactionAdaptor.lastForward(
			id,
			{ receiver: { name: true } },
			{
				receiver: true,
			},
		)
	)?.receiver.name;
}

export async function attachTransactionDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id, uploaderName, documentName } =
		TransactionDTO.TargetDocumentSchema.parse(req.params);

	const creatorName = await TransactionAdaptor.creatorName(id);

	if (!creatorName)
		return res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});

	if (
		req.user.name !== creatorName &&
		req.user.group !== UserGroups.ADMIN &&
		req.user.name !== (await getLastReceiverName(id))
	)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to attach a document to the transaction with the id: "${id}".`,
		});

	try {
		const transactionDocument = await TransactionAdaptor.attachDocument(
			id,
			`${uploaderName}/${documentName}`,
		);

		res.status(200).json({
			status: "success",
			transactionDocument:
				TransactionDTO.DocumentViewSchema.parse(transactionDocument),
		});
	} catch (error: any) {
		if (error instanceof Exceptions.Conflict)
			res.status(409).json({ status: "conflict", message: error.message });
		if (error instanceof Exceptions.Invalid)
			res.status(404).json({ status: "not-found", message: error.message });
		else throw error;
	}
}

export async function detachTransactionDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id, uploaderName, documentName } =
		TransactionDTO.TargetDocumentSchema.parse(req.params);

	const creatorName = await TransactionAdaptor.creatorName(id);

	if (!creatorName)
		return res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: "${id}".`,
		});

	const documentURI = `${uploaderName}/${documentName}`;

	if (
		req.user.name !== creatorName &&
		req.user.name !== uploaderName &&
		req.user.group !== UserGroups.ADMIN &&
		req.user.name !== (await getLastReceiverName(id))
	)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to detach a document from the transaction with the id: "${id}".`,
		});

	const detached = await TransactionAdaptor.detachDocument(id, documentURI);

	if (detached)
		res.status(200).json({
			status: "success",
			detached: { transactionId: id, documentURI },
		});
	else
		res.status(404).json({
			status: "not-found",
			message: `The document "${documentURI}" is not attached to the transaction with the id: "${id}".`,
		});
}

/**
 * TODO: imply the logic:
 * - no forward is inserted unless last receiver has fulfilled the last forward (or the are no forwards).
 * - the sender of the new forward must be either last receiver or last sender (if last receiver updated the forward status)
 * - reject forwarding if transaction is already fulfilled
 */
export async function createTransactionForward(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id } = TransactionDTO.TargetSchema.parse(req.params);

	const { receiverName } = TransactionDTO.ForwardSchema.parse(req.body);

	const transactionForward = await TransactionAdaptor.forward(
		id,
		req.user.name,
		receiverName,
	);
	res.status(200).json({
		status: "success",
		transactionForward:
			TransactionDTO.ForwardViewSchema.parse(transactionForward),
	});
}

export async function viewTransactionForwards(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id } = TransactionDTO.TargetSchema.parse(req.params);

	const { pageNumber, pageSize } = UtilsDTO.Paging.parse(req.query);

	const [forwards, totalForwards] = await TransactionAdaptor.viewForwards(
		id,
		pageNumber,
		pageSize,
	);

	res.status(200).json({
		status: "success",
		page: {
			number: pageNumber,
			size: pageSize,
			last: Math.ceil(totalForwards / pageSize),
		},
		transaction: {
			id,
			forwards: forwards.map((tf) =>
				TransactionDTO.ForwardViewSchema.parse(tf),
			),
		},
	});
}

// TODO: list forward status

export async function updateTransactionForwardStatus(
	req: Request,
	res: Response,
) {
	assertAuthenticatedRequest(req);

	const { id, forwardId } = TransactionDTO.TargetForwardSchema.parse(
		req.params,
	);

	const { status } = TransactionDTO.UpdateForwardStatusSchema.parse(req.body);

	const lastForward = await TransactionAdaptor.lastForward(
		id,
		{ id: true, receiver: { name: true } },
		{
			receiver: true,
		},
	);

	if (!lastForward)
		return res.status(404).json({
			status: "not-found",
			message: `Transaction with the id: "${id}" has not been forwarded yet.`,
		});

	if (forwardId !== lastForward.id)
		return res.status(404).json({
			status: "not-found",
			message: `Transaction with the id: "${id}" has been forwarded afterwards.`,
		});

	if (req.user.name !== lastForward.receiver.name)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to update the transaction forward with the id: "${forwardId}".`,
		});

	const transactionForward = await TransactionAdaptor.updateForwardStatus(
		id,
		forwardId,
		status,
	);

	res.status(200).json({
		status: "success",
		transactionForward:
			TransactionDTO.ForwardViewSchema.parse(transactionForward),
	});
}

export async function deleteTransactionForward(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id, forwardId } = TransactionDTO.TargetForwardSchema.parse(
		req.params,
	);

	const lastForward = await TransactionAdaptor.lastForward(
		id,
		{ id: true, sender: { name: true } },
		{
			sender: true,
		},
	);

	if (!lastForward)
		return res.status(404).json({
			status: "not-found",
			message: `Transaction with the id: "${id}" has not been forwarded yet.`,
		});

	if (forwardId !== lastForward.id)
		return res.status(404).json({
			status: "not-found",
			message: `Transaction with the id: "${id}" has been forwarded afterwards.`,
		});

	if (
		req.user.name !== lastForward.sender.name &&
		req.user.group !== UserGroups.ADMIN
	)
		return res.status(403).json({
			status: "forbidden",
			message: `You don't have access to delete the transaction forward with the id: "${forwardId}".`,
		});

	const deleted = await TransactionAdaptor.deleteForward(id, forwardId);

	if (deleted)
		res
			.status(200)
			.json({ status: "success", deleted: { transactionId: id, forwardId } });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction forward was found with id: "${forwardId}".`,
		});
}

// TODO: update transaction to be fulfilled (and check who is able to do so)
