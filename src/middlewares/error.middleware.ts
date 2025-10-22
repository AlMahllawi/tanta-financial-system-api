import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { NODE_ENV } from "../utils/env.js";
import { BaseCustomException, Exceptions } from "../utils/exceptions.js";
import { logger } from "../utils/logger.js";

export function exposed(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
	timestamp: string,
) {
	if (err instanceof BaseCustomException) {
		res.status(500).json({ status: "error", message: err.message, timestamp });
	} else if (err instanceof ZodError) {
		res.status(400).json({ status: "error", issues: err.issues, timestamp });
	} else {
		const { status, statusCode, expose: _, ...error } = err;
		res
			.status(status ?? statusCode ?? 500)
			.json({ status: "error", ...error, timestamp });
	}
}

export function internal(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
	timestamp: string,
) {
	if (err.expose) exposed(err, req, res, next, timestamp);
	else res.status(500).json({ status: "internal-server-error", timestamp });
}

const handle = NODE_ENV === "development" ? exposed : internal;

export default function (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	if (err.type === "entity.parse.failed")
		return res
			.status(400)
			.json({ status: "bad-request", message: "Parsing failed." });

	const timestamp = new Date().toISOString();

	const { authorization: _, ...requestHeaders } = req.headers;

	if (err instanceof Exceptions.Conflict)
		return res.status(409).json({ status: "conflict", message: err.message });

	if (err instanceof BaseCustomException || err instanceof ZodError)
		return exposed(err, req, res, next, timestamp);

	logger.error({
		timestamp,
		message: err.message,
		stack: err.stack,
		request: {
			method: req.method,
			url: req.originalUrl,
			headers: requestHeaders,
			body: req.body,
			ip: req.ip,
		},
	});

	handle(err, req, res, next, timestamp);
}
