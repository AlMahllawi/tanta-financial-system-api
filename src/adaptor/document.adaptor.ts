import datasource from "../datasource.js";
import { DocumentDTO } from "../dto/document.dto.js";
import { TransactionDocument } from "../entities/transaction.document.entity.js";
import type { User } from "../entities/user.entity.js";

export namespace DocumentAdaptor {
	export async function hasAccess(user: User, documentURI: string) {
		const [uploaderName] = DocumentDTO.URIScheme.parse(documentURI).split("/");
		if (user.name === uploaderName) return true;

		const document = await datasource.getRepository(TransactionDocument).findOne({
			select: { id: true },
			where: {
				documentURI,
				transaction: {
					forwards: {
						receiver: { name: user.name },
					},
				},
			},
			relations: {
				transaction: {
					forwards: {
						receiver: true,
					},
				},
			},
		});

		return document !== null;
	}
}
