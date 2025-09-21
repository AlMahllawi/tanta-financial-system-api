import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Request, Response } from "express";
import multer from "multer";
import {
	assertAuthenticatedRequest,
	assertUploadRequest,
} from "../types/guard.js";
import { DOCUMENTS_PATH } from "../utils/env.js";
import { Exceptions } from "../utils/exceptions.js";

const storage = multer.diskStorage({
	destination: (req: Request, file: Express.Multer.File, cb) => {
		assertAuthenticatedRequest(req);

		const uploadPath = join(
			DOCUMENTS_PATH,
			req.user.name.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase(),
		);

		mkdirSync(uploadPath, { recursive: true });

		(req as any).uploadPath = uploadPath; // TODO: types

		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		assertUploadRequest(req);
		if (existsSync(join(req.uploadPath, file.originalname)))
			cb(
				new Exceptions.Conflict(
					`There exist a file with the name ${file.originalname}`,
				),
				file.originalname,
			);
		cb(null, file.originalname);
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
