import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setSeederFactory } from "typeorm-extension";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import type { Transaction } from "../entities/transaction.entity.js";
import type { User } from "../entities/user.entity.js";
import { DOCUMENTS_PATH } from "../utils/env.js";

export default setSeederFactory(
	TransactionDocument,
	(faker, meta: { transaction: Transaction; uploader: User }) => {
		const transactionDocument = new TransactionDocument();
		transactionDocument.transaction = meta.transaction;
		const filename = `${faker.word.words(3)}.txt`;
		const documentURI = `${meta.uploader.name}/${filename}`;
		const uploaderDir = join(DOCUMENTS_PATH, meta.uploader.name);
		if (!existsSync(uploaderDir)) mkdirSync(uploaderDir);
		writeFileSync(join(uploaderDir, filename), faker.word.words(15));
		transactionDocument.documentURI = documentURI;
		return transactionDocument;
	},
);
