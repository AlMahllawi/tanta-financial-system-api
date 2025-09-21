import type { NextFunction, Request, Response } from "express";
import * as service from "../services/user.service.js";
import { assertAuthenticatedRequest } from "../types/guard.js";

export function permissionsMiddleware(permissions: string | string[]) {
	if (typeof permissions === "string") permissions = [permissions];
	return async (req: Request, res: Response, next: NextFunction) => {
		assertAuthenticatedRequest(req);

		const missingPermissions = await service.missingPermissions(
			req.user.name,
			permissions,
		);

		if (missingPermissions.length === 0) next();
		else
			res
				.status(403)
				.json({ status: "forbidden", missing: missingPermissions });
	};
}
