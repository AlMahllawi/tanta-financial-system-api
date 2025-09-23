import { z } from "zod";

export namespace UserDTO {
	export const ViewSchema = z
		.object({
			name: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
		})
		.strip();

	export const NameSchema = z
		.string()
		.min(5, "Too short user name")
		.max(255, "Too long user name")
		.regex(
			/^[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-\s]*[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]+[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-_\s]*/g,
		);

	export const Token = z
		.object(
			{
				name: NameSchema,
			},
			"Invalid token",
		)
		.strict();

	export type Token = z.infer<typeof Token>;

	export const TargetSchema = z
		.object({
			name: NameSchema,
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
			password: z
				.string()
				.refine(
					(value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
					{
						message:
							"Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.",
					},
				),
		})
		.strict();
}
