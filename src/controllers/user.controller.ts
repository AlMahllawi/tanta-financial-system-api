import type { Request, Response } from "express";
import { UserAdaptor } from "../adaptor/user.adaptor.js";
import { UserDTO } from "../dto/user.dto.js";
import { UtilsDTO } from "../dto/utils.dto.js";
import { UserGroups } from "../types/enums.js";
import { assertAuthenticatedRequest } from "../types/guard.js";
import { Exceptions } from "../utils/exceptions.js";

export async function authorizeUser(req: Request, res: Response) {
	const { name, password } = UserDTO.AuthorizeSchema.parse(req.body);

	try {
		const token = await UserAdaptor.authorize(name, password);
		res
			.status(200)
			.json({ status: "success", message: "Logged in successfully.", token });
	} catch (error: any) {
		if (!(error instanceof Exceptions.Invalid)) throw error;

		res.status(401).json({ status: "unauthorized", message: error.message });
	}
}

export async function viewAllUsers(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { pageNumber, pageSize } = UtilsDTO.Paging.parse(req.query);

	const users = await UserAdaptor.viewAll(pageNumber, pageSize);

	res.status(200).json({
		status: "success",
		page: { number: pageNumber, size: pageSize },
		users: users.map((u) => UserDTO.ViewSchema.parse(u)),
	});
}

export async function createUser(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	if (req.user.group !== UserGroups.ADMIN)
		return res.status(403).json({
			status: "forbidden",
			message: "Missing access to create a user.",
		});

	const { name, password } = UserDTO.CreationSchema.parse(req.body);
	try {
		const user = await UserAdaptor.create(name, password);

		res
			.status(201)
			.json({ status: "success", user: UserDTO.ViewSchema.parse(user) });
	} catch (error: any) {
		if (!(error instanceof Exceptions.Conflict)) throw error;

		res.status(409).json({ status: "conflict", message: error.message });
	}
}

export async function viewUser(req: Request, res: Response) {
	assertAuthenticatedRequest(req);
	const { name } = UserDTO.TargetSchema.parse(req.params);
	const user = await UserAdaptor.view(name);
	if (user)
		res
			.status(200)
			.json({ status: "success", user: UserDTO.ViewSchema.parse(user) });
	else
		res.status(404).json({
			status: "not-found",
			message: `No user was found with name: ${name}.`,
		});
}
