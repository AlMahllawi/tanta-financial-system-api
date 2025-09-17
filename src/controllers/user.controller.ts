import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/user.service.js";
import { ExpectedError } from "../utils/custom.errors.js";
import { userNameSchema } from "../utils/validation.schema.js";

const authorizeBodySchema = z.object({
	name: userNameSchema,
	password: z.string().min(8, "Invalid password"),
});

export async function authorizeUser(req: Request, res: Response) {
	const { name, password } = authorizeBodySchema.parse(req.body);

	try {
		const token = await service.authorizeUser(name, password);
		res
			.status(200)
			.json({ status: "success", message: "Logged in successfully.", token });
	} catch (error: any) {
		if (error instanceof ExpectedError && error.code === "invalid-credentials")
			res.status(401).json({ status: "unauthorized", message: error.message });
		else throw error;
	}
}

export async function viewAllUsers(req: Request, res: Response) {
	res.status(200).json(await service.viewAllUsers());
}

const userCreationBodySchema = z.object({
	name: userNameSchema,
	password: z
		.string()
		.refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value), {
			message:
				"Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.",
		}),
});

export async function createUser(req: Request, res: Response) {
	const { name, password } = userCreationBodySchema.parse(req.body);
	try {
		res.status(201).json(await service.createUser(name, password));
	} catch (error: any) {
		if (error instanceof ExpectedError && error.code === "user-exists")
			res.status(409).json({ status: "conflict", message: error.message });
		else throw error;
	}
}

const viewUserParamsSchema = z.object({
	id: z.coerce.number().int().min(1),
});

export async function viewUser(req: Request, res: Response) {
	const { id } = viewUserParamsSchema.parse(req.params);
	const user = await service.viewUser(id);
	if (user) res.status(200).json(user);
	else
		res.status(404).json({
			status: "not-found",
			message: `No user was found with id ${id}.`,
		});
}
