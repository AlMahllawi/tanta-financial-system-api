import type { Request } from "express";
import { Exceptions } from "../utils/exceptions.js";
import type { AuthenticatedRequest } from "./interfaces.js";

export function assertAuthenticatedRequest(
	req: Request,
): asserts req is AuthenticatedRequest {
	if (!(req as AuthenticatedRequest).user)
		throw new Exceptions.Unauthorized("This endpoint requires authorization.");
}
