import type { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../utils/env.js";
import { logger } from "../utils/logger.js";

function logError(err: any) {
	// TODO: provide request context
	// TODO: ignore user error (e.g. entity.parse.failed)
	logger.error(err);
}

export function sourceErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	logError(err);
	res.status(err.status ?? err.statusCode ?? 500).json(err);
}

export function minimalErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	logError(err);
	if (err.expose) res.status(err.status ?? err.statusCode ?? 500).json(err);
	else res.status(500).json({ status: "internal-server-error" });
}

export default NODE_ENV === "development"
	? sourceErrorHandler
	: minimalErrorHandler;
