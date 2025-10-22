import { In } from "typeorm";
import datasource from "../datasource.js";
import { DocumentDTO } from "../dto/document.dto.js";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import type { User } from "../entities/user.entity.js";

export namespace DocumentAdaptor {
	export async function hasAccess(user: User, documentURI: string) {
		const [uploaderName] = DocumentDTO.URIScheme.parse(documentURI).split("/");
		if (user.name === uploaderName) return true;

		const transactionsIds = (
			await datasource
				.getRepository(TransactionDocument)
				.find({ select: { transaction: { id: true } }, where: { documentURI } })
		).flatMap((td) => td.transaction.id);

		return (
			(await datasource.getRepository(TransactionForward).findOne({
				select: { id: true },
				relations: { transaction: true },
				where: { transaction: { id: In(transactionsIds) }, receiver: user },
			})) !== null
		);
	}
}
