import z from "zod";
import { NameRegExp } from "../utils/regex.js";
import { UserDTO } from "./user.dto.js";

export namespace DocumentDTO {
	export const URIScheme = z
		.string()
		.trim()
		.nonempty()
		.regex(
			new RegExp(
				`^${NameRegExp.source}\\/${NameRegExp.source}$`,
				NameRegExp.flags,
			),
		);

	export const NameScheme = z
		.string()
		.trim()
		.nonempty()
		.regex(
			new RegExp(`^${NameRegExp.source}\\.[A-Za-z0-9]+$`, NameRegExp.flags),
		);

	export const TargetScheme = z
		.object({
			uploaderName: UserDTO.NameSchema,
			documentName: NameScheme,
		})
		.strict();
}
