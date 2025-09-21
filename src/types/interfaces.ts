import type { Request } from "express";
import type { User } from "../entities/user.entity.js";

export interface AuthenticatedRequest extends Request {
	user: User;
}
