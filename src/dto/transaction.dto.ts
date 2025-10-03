import { z } from "zod";
import {
	TransactionForwardStatus,
	TransactionPriority,
} from "../types/enums.js";
import { UserDTO } from "./user.dto.js";

export namespace TransactionDTO {
	export const TypeViewSchema = z.object({ name: z.string() }).strip();

	const PrioritySchema = z.enum(TransactionPriority, "Invalid priority");

	export const ViewSchema = z
		.object({
			id: z.number(),
			title: z.string(),
			description: z.string(),
			type: TypeViewSchema,
			fulfilled: z.boolean(),
			priority: PrioritySchema,
			creator: UserDTO.ViewSchema,
			createdAt: z.date(),
		})
		.strip();

	export type View = z.infer<typeof ViewSchema>;

	export const DocumentViewSchema = z
		.object({
			id: z.number(),
			transactionId: z.number(),
			documentURI: z.string(),
		})
		.strip();

	const ForwardStatusSchema = z.enum(
		TransactionForwardStatus,
		"Invalid status",
	);

	export const ForwardViewSchema = z
		.object({
			id: z.int(),
			status: ForwardStatusSchema,
			sender: UserDTO.ViewSchema,
			receiver: UserDTO.ViewSchema,
			forwardedAt: z.date(),
			updatedAt: z.date(),
		})
		.strip();

	export const TypeNameSchema = z
		.string()
		.min(5, "Too short transaction type name")
		.max(255, "Too long transaction type name");

	export const TypeCreationSchema = z.object({ name: TypeNameSchema }).strict();

	const IdSchema = z.coerce.number().int().nonnegative();

	export const CreationSchema = z
		.object({
			title: z
				.string()
				.min(5, "Too short transaction title")
				.max(255, "Too long transaction title"),
			description: z.string().min(5, "Too short transaction description"),
			typeName: TypeNameSchema,
			priority: PrioritySchema.default(TransactionPriority.LOW),
		})
		.strict();

	export const TargetSchema = z
		.object({
			id: IdSchema,
		})
		.strict();

	export const UpdatesSchema = z
		.object({
			...CreationSchema.shape,
			priority: PrioritySchema,
			fulfilled: z.boolean(),
		})
		.strict()
		.partial()
		.refine((obj) => Object.keys(obj).length > 0, {
			message: "At least one modification must be provided",
		});

	export type Updates = z.infer<typeof UpdatesSchema>;

	export const ForwardSchema = z
		.object({
			receiverName: UserDTO.NameSchema,
		})
		.strict();

	export const TargetForwardSchema = z
		.object({
			...TargetSchema.shape,
			forwardId: IdSchema,
		})
		.strict();

	export const UpdateForwardStatusSchema = z
		.object({
			status: ForwardStatusSchema,
		})
		.strict();

	export const TargetDocumentSchema = z
		.object({
			id: IdSchema,
			userName: UserDTO.NameSchema,
			document: z
				.string()
				.regex(
					/^[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-\s]*[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]+[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-_\s]*\.[a-zA-Z0-9]+$/g,
				)
				.toLowerCase(),
		})
		.strict();
}
