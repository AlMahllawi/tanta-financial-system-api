import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type {
	TokenContent,
	UserAuthRequest,
	UserCreationRequest,
	UserViewRequest,
} from "../middlewares/user.middleware.js";
import { userRepository } from "../repositories/user.repository.js";
import { ExpectedError } from "../utils/custom.errors.js";
import { JWT_SECRET } from "../utils/env.js";

export async function authorizeUser(req: UserAuthRequest, res: Response) {
	const { name, password } = req.body;

	const user = await userRepository.authorize(name, password);

	if (!user) return res.status(401).json({ error: "Invalid credentials" });

	const content: TokenContent = { id: user.id };

	const token = jwt.sign(content, JWT_SECRET, { expiresIn: "1d" });
	res
		.status(200)
		.json({ status: "success", message: "Logged in successfully.", token });
}

export async function viewAllUsers(req: Request, res: Response) {
	res.status(200).json(await userRepository.viewAll());
}

export async function createUser(req: UserCreationRequest, res: Response) {
	const { name, password } = req.body;
	try {
		res.status(201).json(await userRepository.create(name, password));
	} catch (error: any) {
		if (error instanceof ExpectedError && error.code === "user-exists")
			res.status(409).json({ status: "conflict", message: error.message });
	}
}

export async function viewUser(req: UserViewRequest, res: Response) {
	const { id } = req.params;
	const user = await userRepository.view(id);
	if (user) res.status(200).json(user);
	else
		res.status(404).json({
			status: "not-found",
			message: `No user was found with id ${id}.`,
		});
}
