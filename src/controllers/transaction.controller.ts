import type { Request, Response } from "express";
import z from "zod";
import { TransactionAdaptor } from "../adaptor/transaction.adaptor.js";
import { assertAuthenticatedRequest } from "../types/guard.js";
import { Exceptions } from "../utils/exceptions.js";

export async function viewTransactionTypes(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const transactionTypes = await TransactionAdaptor.viewTypes();

	res
		.status(200)
		.json({ status: "success", "transaction-types": transactionTypes });
}

const transactionTypeCreationBodySchema = z.object({
	name: z.string().min(5, "Too short name").max(255, "Too long name"),
});

export async function createTransactionType(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name } = transactionTypeCreationBodySchema.parse(req.body);
	try {
		const transactionType = await TransactionAdaptor.createType(name);
		res
			.status(201)
			.json({ status: "success", "transaction-type": transactionType });
	} catch (error: unknown) {
		if (!(error instanceof Exceptions.Conflict)) throw error;

		res.status(409).json({ status: "conflict", message: error.message });
	}
}
