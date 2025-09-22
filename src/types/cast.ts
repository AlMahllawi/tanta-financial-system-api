import type { Request } from "express";
import type { User } from "../entities/user.entity.js";
import type { AuthenticatedRequest, UploadRequest } from "./interfaces.js";

export function castToAuthenticatedRequest(
	req: Request,
	user: User,
): asserts req is AuthenticatedRequest {
	(req as AuthenticatedRequest).user = user;
}

export function castToUploadRequest(
	req: Request,
	uploadPath: string,
): asserts req is UploadRequest {
	(req as UploadRequest).uploadPath = uploadPath;
}
