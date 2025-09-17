import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../utils/env.js";
import { logger } from "../utils/logger.js";

export function exposed(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
	uuid: string,
) {
	res.status(err.status ?? err.statusCode ?? 500).json({ ...err, uuid });
}

export function internal(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
	uuid: string,
) {
	if (err.expose) exposed(err, req, res, next, uuid);
	else res.status(500).json({ status: "internal-server-error", uuid });
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

	const uuid = randomUUID();

	logger.error({
		message: err.message,
		stack: err.stack,
		uuid,
		request: {
			method: req.method,
			url: req.originalUrl,
			headers: req.headers,
			body: req.body,
			ip: req.ip,
		},
	});

	handle(err, req, res, next, uuid);
}
