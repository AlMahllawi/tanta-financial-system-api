import type { NextFunction, Request, Response } from "express";
import { UserAdaptor } from "../adaptor/user.adaptor.js";
import { assertAuthenticatedRequest } from "../types/guard.js";

export function missingPermissionResponse(res: Response, missing: string[]) {
	res.status(403).json({ status: "forbidden", missing });
}

export function permissionsMiddleware(permissions: string | string[]) {
	if (typeof permissions === "string") permissions = [permissions];
	return async (req: Request, res: Response, next: NextFunction) => {
		assertAuthenticatedRequest(req);

		const missingPermissions = await UserAdaptor.missingPermissions(
			req.user.name,
			permissions,
		);

		if (missingPermissions.length > 0)
			return missingPermissionResponse(res, missingPermissions);

		next();
	};
}
