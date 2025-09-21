import type { Request } from "express";
import { Exceptions } from "../utils/exceptions.js";
import type { AuthenticatedRequest, UploadRequest } from "./interfaces.js";

export function assertAuthenticatedRequest(
	req: Request,
): asserts req is AuthenticatedRequest {
	if (!(req as AuthenticatedRequest).user)
		throw new Exceptions.Unauthorized("This endpoint requires authorization.");
}

export function assertUploadRequest(
	req: Request,
): asserts req is UploadRequest {
	if (!(req as UploadRequest).uploadPath)
		throw new Exceptions.Invalid("`uploadPath` is missing.");
}
