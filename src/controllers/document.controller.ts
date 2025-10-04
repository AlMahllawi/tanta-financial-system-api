import { existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Request, Response } from "express";
import multer from "multer";
import { DocumentDTO } from "../dto/document.dto.js";
import { castToUploadRequest } from "../types/cast.js";
import { UserGroups } from "../types/enums.js";
import {
	assertAuthenticatedRequest,
	assertUploadRequest,
} from "../types/guard.js";
import { DOCUMENTS_PATH } from "../utils/env.js";
import { Exceptions } from "../utils/exceptions.js";

const storage = multer.diskStorage({
	destination: (req: Request, file: Express.Multer.File, cb) => {
		assertAuthenticatedRequest(req);

		const uploadPath = join(DOCUMENTS_PATH, req.user.name);

		mkdirSync(uploadPath, { recursive: true });

		castToUploadRequest(req, uploadPath);

		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		assertUploadRequest(req);
		const filename = file.originalname.toLowerCase();
		if (existsSync(join(req.uploadPath, filename)))
			cb(
				new Exceptions.Conflict(`There exist a file with the name ${filename}`),
				filename,
			);
		cb(null, filename);
	},
});

export const upload = multer({
	storage,
});

export async function uploadDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { file } = req;

	if (!file)
		throw new Exceptions.Invalid("A file is required to create a document.");

	res.status(200).json({
		status: "success",
		documentURI: join(basename(dirname(file.path)), file.filename),
	});
}

export async function viewDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { userName, documentName } = DocumentDTO.TargetScheme.parse(req.params);

	const documentURI = join(userName, documentName);

	const documentPath = join(DOCUMENTS_PATH, documentURI);

	if (!existsSync(documentPath))
		return res.status(404).json({
			status: "not-found",
			message: `There was no document: "${documentURI}".`,
		});

	res.status(200).sendFile(documentPath);
}

export async function deleteDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { userName, documentName } = DocumentDTO.TargetScheme.parse(req.params);

	if (req.user.name !== userName && req.user.group !== UserGroups.ADMIN)
		throw new Exceptions.Forbidden(
			`The document ${documentName} belongs to the user ${userName}. Can't proceed with the deletion.`,
		);

	const documentURI = join(userName, documentName);

	const documentPath = join(DOCUMENTS_PATH, documentURI);

	if (!existsSync(documentPath))
		return res.status(404).json({
			status: "not-found",
			message: `There was no document: "${documentURI}".`,
		});

	rmSync(documentPath);

	res.status(200).json({
		status: "success",
		deleted: documentURI,
	});
}
