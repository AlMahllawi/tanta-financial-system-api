import z from "zod";
import { UserDTO } from "./user.dto.js";

export namespace DocumentDTO {
	export const URIScheme = z.object({
		userName: UserDTO.NameSchema,
		document: z
			.string()
			.regex(/^[a-zA-Z0-9._-]+$/)
			.toLowerCase(),
	});
}
