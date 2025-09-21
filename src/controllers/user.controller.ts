import type { Request, Response } from "express";
import { z } from "zod";
import { UserDTO } from "../dto/user.dto.js";
import * as service from "../services/user.service.js";
import { assertAuthenticatedRequest } from "../types/guard.js";
import { ExpectedError } from "../utils/custom.errors.js";

const authorizeBodySchema = z.object({
	name: UserDTO.NameSchema,
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
	assertAuthenticatedRequest(req);
	const users = await service.viewAllUsers();
	res.status(200).json({ status: "success", users });
}

const userCreationBodySchema = z.object({
	name: UserDTO.NameSchema,
	password: z
		.string()
		.refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value), {
			message:
				"Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.",
		}),
});

export async function createUser(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name, password } = userCreationBodySchema.parse(req.body);
	try {
		const user = await service.createUser(name, password);
		res.status(201).json({ status: "success", user });
	} catch (error: any) {
		if (error instanceof ExpectedError && error.code === "user-exists")
			res.status(409).json({ status: "conflict", message: error.message });
		else throw error;
	}
}

const viewUserParamsSchema = z.object({
	name: UserDTO.NameSchema,
});

export async function viewUser(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name } = viewUserParamsSchema.parse(req.params);
	const user = await service.viewUser(name);
	if (user) res.status(200).json({ status: "success", user });
	else
		res.status(404).json({
			status: "not-found",
			message: `No user was found with name: ${name}.`,
		});
}
