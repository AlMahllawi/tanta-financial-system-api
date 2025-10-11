import { z } from "zod";
import { UserGroups } from "../types/enums.js";
import { IsNameRegExp } from "../utils/regex.js";

export namespace UserDTO {
	export const ViewSchema = z
		.object({
			name: z.string(),
			group: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
		})
		.strip();

	export const NameSchema = z
		.string()
		.trim()
		.min(5, "Too short user name")
		.max(255, "Too long user name")
		.regex(IsNameRegExp);

	export const Token = z.looseObject(
		{
			name: NameSchema,
		},
		"Invalid token",
	);

	export type Token = z.infer<typeof Token>;

	export const TargetSchema = z
		.object({
			name: NameSchema,
		})
		.strict();

	const PasswordSchema = z
		.string()
		.refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value), {
			message:
				"Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.",
		});

	export const ChangePasswordSchema = z
		.object({
			password: PasswordSchema,
		})
		.strict();

	export const AuthorizeSchema = z
		.object({
			name: NameSchema,
			password: z.string().min(8, "Invalid password"),
		})
		.strict();

	export const CreationSchema = z
		.object({
			name: UserDTO.NameSchema,
			password: PasswordSchema,
			group: z.enum(UserGroups).default(UserGroups.USER),
		})
		.strict();
}
