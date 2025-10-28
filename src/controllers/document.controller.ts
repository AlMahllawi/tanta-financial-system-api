import { existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Request, Response } from "express";
import multer from "multer";
import { DocumentAdaptor } from "../adaptor/document.adaptor.js";
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
		let filename = file.originalname.toLowerCase();

		try {
			filename = DocumentDTO.NameScheme.parse(filename);
		} catch (error: any) {
			return cb(error, filename);
		}

		if (existsSync(join(req.uploadPath, filename)))
			return cb(
				new Exceptions.Conflict(
					`There exist a file with the name "${filename}".`,
				),
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
		documentURI: `${basename(dirname(file.path))}/${file.filename}`,
	});
}

// TODO: list user documents

export async function viewDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { uploaderName, documentName } = DocumentDTO.TargetScheme.parse(
		req.params,
	);

	const documentURI = `${uploaderName}/${documentName}`;

	const documentPath = join(DOCUMENTS_PATH, uploaderName, documentName);

	if (!existsSync(documentPath))
		return res.status(404).json({
			status: "not-found",
			message: `There was no document: "${documentURI}".`,
		});

	if (
		req.user.group !== UserGroups.ADMIN &&
		!(await DocumentAdaptor.hasAccess(req.user, documentURI))
	)
		return res.status(403).json({
			status: "forbidden",
			message: `Missing access to document: "${documentURI}".`,
		});

	res.status(200).sendFile(documentPath);
}

export async function deleteDocument(req: Request, res: Response) {
	assertAuthenticatedRequest(req);

	const { uploaderName, documentName } = DocumentDTO.TargetScheme.parse(
		req.params,
	);

	if (req.user.name !== uploaderName && req.user.group !== UserGroups.ADMIN)
		throw new Exceptions.Forbidden(
			`The document ${documentName} belongs to the user ${uploaderName}. Can't proceed with the deletion.`,
		);

	const documentURI = `${uploaderName}/${documentName}`;

	const documentPath = join(DOCUMENTS_PATH, uploaderName, documentName);

	if (!existsSync(documentPath))
		return res.status(404).json({
			status: "not-found",
			message: `There was no document: "${documentURI}".`,
		});

	rmSync(documentPath);

	res.status(200).json({
		status: "success",
		deleted: { documentURI },
	});
}
