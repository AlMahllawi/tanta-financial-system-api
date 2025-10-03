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

	const { title, description, typeName, priority } =
		TransactionDTO.CreationSchema.parse(req.body);

	const transaction = await TransactionAdaptor.create(
		title,
		description,
		typeName,
		req.user.name,
		priority,
	);

	res.status(201).json({
		status: "success",
		transaction: TransactionDTO.ViewSchema.parse(transaction),
	});
}

export async function viewTransactions(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const viewCreated = "created" in req.query;
	if (!viewCreated && req.user.group !== UserGroups.ADMIN)
		return res.status(403).json({
			status: "forbidden",
			message: "Missing access to view all transactions.",
		});

	const { pageNumber, pageSize } = UtilsDTO.Paging.parse(req.query);

	const transactions = await (viewCreated
		? TransactionAdaptor.createdBy(req.user.name, pageNumber, pageSize)
		: TransactionAdaptor.viewAll(pageNumber, pageSize));

	res.status(200).json({
		status: "success",
		page: { number: pageNumber, size: pageSize },
		transactions: transactions.map((t) => TransactionDTO.ViewSchema.parse(t)),
	});
}

export async function viewTransaction(req: Request, res: Response) {
	const { id } = TransactionDTO.TargetSchema.parse(req.params);
	// TODO: check access
	const transaction = await TransactionAdaptor.view(id);
	if (transaction)
		res.status(200).json({
			status: "success",
			transaction: TransactionDTO.ViewSchema.parse(transaction),
		});
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: ${id}.`,
		});
}

export async function updateTransaction(req: Request, res: Response) {
	const { id } = TransactionDTO.TargetSchema.parse(req.params);
	const updates = TransactionDTO.UpdatesSchema.parse(req.body);

	// TODO: check access

	const updatedTransaction = await TransactionAdaptor.update(id, updates);

	res.status(200).json({
		status: "success",
		updatedTransaction: TransactionDTO.ViewSchema.parse(updatedTransaction),
	});
}

export async function deleteTransaction(req: Request, res: Response) {
	const { id } = TransactionDTO.TargetSchema.parse(req.params);
	// TODO: check access
	const deleted = await TransactionAdaptor.remove(id);
	if (deleted) res.status(200).json({ status: "success", deleted: id });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: ${id}.`,
		});
}

export async function attachTransactionDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	// TODO: check access

	const { id, userName, document } = TransactionDTO.TargetDocumentSchema.parse(
		req.params,
	);

	const transactionDocument = await TransactionAdaptor.attachDocument(
		id,
		`${userName}/${document}`,
	);

	res.status(200).json({
		status: "success",
		transactionDocument:
			TransactionDTO.DocumentViewSchema.parse(transactionDocument),
	});
}

export async function detachTransactionDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	// TODO: check access

	const { id, userName, document } = TransactionDTO.TargetDocumentSchema.parse(
		req.params,
	);

	const documentURI = `${userName}/${document}`;

	const deleted = await TransactionAdaptor.detachDocument(id, documentURI);

	if (deleted)
		res.status(200).json({ status: "success", deleted: documentURI });
	else
		res.status(404).json({
			status: "not-found",
			message: `No document ${documentURI} for the transaction id: ${id}.`,
		});
}

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

	const transactionForwards = await TransactionAdaptor.viewForwards(
		id,
		pageNumber,
		pageSize,
	);

	res.status(200).json({
		status: "success",
		page: { number: pageNumber, size: pageSize },
		transactionId: id,
		transactionForwards: transactionForwards.map((tf) =>
			TransactionDTO.ForwardViewSchema.parse(tf),
		),
	});
}

export async function updateTransactionForwardStatus(
	req: Request,
	res: Response,
) {
	const { id, forwardId } = TransactionDTO.TargetForwardSchema.parse(
		req.params,
	);

	const { status } = TransactionDTO.UpdateForwardStatusSchema.parse(req.body);

	// TODO: must be last receiver

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
	const { id, forwardId } = TransactionDTO.TargetForwardSchema.parse(
		req.params,
	);

	// TODO: must be last sender, creator or admin

	const deleted = await TransactionAdaptor.deleteForward(id, forwardId);

	if (deleted) res.status(200).json({ status: "success", deleted: forwardId });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction forward was found with id: ${forwardId}.`,
		});
}
