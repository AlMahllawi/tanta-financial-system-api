import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserAdaptor } from "../adaptor/user.adaptor.js";
import { UserDTO } from "../dto/user.dto.js";
import { castToAuthenticatedRequest } from "../types/cast.js";
import { JWT_SECRET } from "../utils/env.js";

export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	function unauthorized(message: string) {
		res.status(401).json({ status: "unauthorized", message });
	}

	const authHeader = req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return unauthorized("No token was provided, authorization denied.");
	}

	let payload: any;
	try {
		payload = jwt.verify(authHeader.slice("Bearer ".length), JWT_SECRET);
	} catch {
		return unauthorized("Invalid token.");
	}

	const { name } = UserDTO.Token.parse(payload);

	const user = await UserAdaptor.view(name);

	if (!user) return unauthorized("Invalid token.");

	castToAuthenticatedRequest(req, user);

	next();
}
