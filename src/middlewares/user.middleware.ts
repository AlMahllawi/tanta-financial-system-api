import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/env.js";

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
		// TODO: types
		(req as any).user = jwt.verify(
			authHeader.slice("Bearer ".length),
			JWT_SECRET,
		);
		next();
	} catch {
		return res
			.status(401)
			.json({ status: "unauthorized", message: "Invalid token." });
	}
}
