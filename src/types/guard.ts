import type { Request } from "express";
import { ExpectedError } from "../utils/custom.errors.js";
import type { AuthenticatedRequest } from "./interfaces.js";

export function assertAuthenticatedRequest(
	req: Request,
): asserts req is AuthenticatedRequest {
	if (!(req as AuthenticatedRequest).user)
		throw new ExpectedError(
			"unauthorized",
			"This endpoint requires authorization.",
		);
}
