import type { NextFunction, Request, Response } from "express";
import { checkSchema } from "express-validator";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/env.js";

export interface TokenContent {
	id: number;
}

export interface AuthenticatedRequest extends Request {
	user: TokenContent;
}

export function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const authHeader = req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			status: "unauthorized",
			message: "No token was provided, authorization denied.",
		});
	}

	try {
		const decoded = jwt.verify(authHeader.slice("Bearer ".length), JWT_SECRET);
		(req as AuthenticatedRequest).user = decoded as TokenContent; // TODO: handle better
		next();
	} catch {
		return res
			.status(401)
			.json({ status: "unauthorized", message: "Invalid token." });
	}
}

export interface UserAuthRequest extends Request {
	body: { name: string; password: string };
}

export const userAuthSchema = checkSchema({
	name: {
		in: ["body"],
		isLength: { options: { min: 5, max: 255 } },
		errorMessage: "Invalid name",
	},
	password: {
		in: ["body"],
		custom: {
			options: (value: string) => {
				const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
				if (!regex.test(value))
					throw new Error(
						"Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.",
					);

				return true;
			},
		},
	},
});

export interface UserCreationRequest extends UserAuthRequest {}

export const userCreationSchema = checkSchema({
	name: {
		in: ["body"],
		isLength: { options: { min: 5, max: 255 } },
		errorMessage: "Invalid name",
	},
	password: {
		in: ["body"],
		isLength: { options: { min: 8 }, errorMessage: "Invalid password." },
	},
});

export interface UserViewRequest extends Request<{ id: number }> {}

export const userViewSchema = checkSchema({
	id: {
		in: ["params"],
		custom: {
			options: (value: string) => {
				const parsed = parseInt(value, 10);
				if (Number.isNaN(parsed) || parsed <= 0)
					throw new Error("Invalid identifier.");

				return true;
			},
		},
		toInt: true,
	},
});
