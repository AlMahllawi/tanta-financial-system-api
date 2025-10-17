import z from "zod";
import { NameRegExp } from "../utils/regex.js";
import { UserDTO } from "./user.dto.js";

export namespace DocumentDTO {
	const DocumentNameRegExp = new RegExp(
		`${NameRegExp.source}\\.[A-Za-z0-9]+`,
		NameRegExp.flags,
	);

	export const URIScheme = z
		.string()
		.trim()
		.nonempty()
		.regex(
			new RegExp(
				`^${NameRegExp.source}\\/${DocumentNameRegExp.source}$`,
				NameRegExp.flags,
			),
		);

	export const URIsScheme = z.array(URIScheme);

	export type URIs = z.infer<typeof URIsScheme>;

	export const NameScheme = z
		.string()
		.trim()
		.nonempty()
		.regex(
			new RegExp(`^${DocumentNameRegExp.source}$`, DocumentNameRegExp.flags),
		);

	export const TargetScheme = z
		.object({
			uploaderName: UserDTO.NameSchema,
			documentName: NameScheme,
		})
		.strict();
}
