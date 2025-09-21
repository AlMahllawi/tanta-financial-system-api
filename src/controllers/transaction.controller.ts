import type { Request, Response } from "express";
import z from "zod";
import * as service from "../services/transaction.service.js";
import { assertAuthenticatedRequest } from "../types/guard.js";
import { ExpectedError } from "../utils/custom.errors.js";

export async function viewTransactionTypes(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	res.status(200).json(await service.transactionsTypes());
}

const transactionTypeCreationBodySchema = z.object({
	name: z.string().min(5, "Too short name").max(255, "Too long name"),
});

export async function createTransactionType(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name } = transactionTypeCreationBodySchema.parse(req.body);
	try {
		const transactionType = await service.createTransactionType(name);
		res
			.status(201)
			.json({ status: "success", "transaction-type": transactionType });
	} catch (error: any) {
		if (
			error instanceof ExpectedError &&
			error.code === "transaction-type-exists"
		)
			res.status(409).json({ status: "conflict", message: error.message });
	}
}
