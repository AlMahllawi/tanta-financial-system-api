import jwt from "jsonwebtoken";
import type { RequestUser } from "../interfaces.js";
import { userRepository } from "../repositories/user.repository.js";
import { ExpectedError } from "../utils/custom.errors.js";
import { JWT_SECRET } from "../utils/env.js";

export async function authorizeUser(name: string, password: string) {
	const user = await userRepository.authorize(name, password);

	if (!user)
		throw new ExpectedError(
			"invalid-credentials",
			"Invalid authentication credentials.",
		);

	const content: RequestUser = { id: user.id };

	return jwt.sign(content, JWT_SECRET, { expiresIn: "1d" });
}

export const viewAllUsers = userRepository.viewAll;
export const createUser = userRepository.create;
export const viewUser = userRepository.view;
