import { z } from "zod";

export namespace UserDTO {
	export const NameSchema = z
		.string()
		.min(5, "Too short user name")
		.max(255, "Too long user name");

	export const Token = z.object(
		{
			name: NameSchema,
		},
		"Invalid token",
	);

	export type Token = z.infer<typeof Token>;
}
