import type { Request, Response } from "express";
import { TransactionAdaptor } from "../adaptor/transaction.adaptor.js";
import { TransactionDTO } from "../dto/transaction.dto.js";
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
		res.status(201).json({ status: "success", transactionType });
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

	res.status(201).json({ status: "success", transaction: transaction });
}

export async function viewTransactions(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const transactions = await ("all" in req.query
		? TransactionAdaptor.view()
		: TransactionAdaptor.view(req.user));

	res.status(200).json({ status: "success", transactions });
}

export async function viewTransaction(req: Request, res: Response) {
	const { id } = TransactionDTO.TargetSchema.parse(req.params);
	const transaction = await TransactionAdaptor.view(id);
	if (transaction) res.status(200).json({ status: "success", transaction });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction was found with id: ${id}.`,
		});
}

export async function updateTransaction(req: Request, res: Response) {
	const { transactionId, updates } = TransactionDTO.UpdatingSchema.parse(
		req.body,
	);

	const updatedTransaction = await TransactionAdaptor.update(
		transactionId,
		updates,
	);

	res.status(200).json({ status: "success", updatedTransaction });
}

export async function deleteTransaction(req: Request, res: Response) {
	const { id } = TransactionDTO.TargetSchema.parse(req.params);
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

	const { id, userName, document } = TransactionDTO.TargetDocumentSchema.parse(
		req.params,
	);

	const transactionDocument = await TransactionAdaptor.attachDocument(
		id,
		`${userName}/${document}`,
	);

	res.status(200).json({ status: "success", transactionDocument });
}

export async function detachTransactionDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { id, userName, document } = TransactionDTO.TargetDocumentSchema.parse(
		req.params,
	);

	const documentURI = `${userName}/${document}`;

	const deleted = await TransactionAdaptor.detachDocument(id, documentURI);

	if (deleted)
		res.status(200).json({ status: "success", deleted: documentURI });
	else
		res.status(410).json({
			status: "gone",
			message: `No document ${documentURI} for the transaction id: ${id}.`,
		});
}

export async function createTransactionForward(req: Request, res: Response) {
	const { transactionId, status, senderName, receiverName } =
		TransactionDTO.ForwardSchema.parse(req.body);
	const transactionForward = await TransactionAdaptor.forward(
		transactionId,
		senderName,
		receiverName,
		status,
	);
	res.status(200).json({ status: "success", transactionForward });
}

export async function updateTransactionForwardStatus(
	req: Request,
	res: Response,
) {
	const { transactionId, forwardId, status } =
		TransactionDTO.UpdateForwardStatusSchema.parse(req.body);

	const transactionForward = await TransactionAdaptor.updateForwardStatus(
		transactionId,
		forwardId,
		status,
	);

	res.status(200).json({ status: "success", transactionForward });
}

export async function deleteTransactionForward(req: Request, res: Response) {
	const { transactionId, forwardId } = TransactionDTO.DeleteForwardSchema.parse(
		req.body,
	);

	const deleted = await TransactionAdaptor.deleteForward(
		transactionId,
		forwardId,
	);

	if (deleted) res.status(200).json({ status: "success", deleted: forwardId });
	else
		res.status(404).json({
			status: "not-found",
			message: `No transaction forward was found with id: ${forwardId}.`,
		});
}
