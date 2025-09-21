import { z } from "zod";
import {
	TransactionForwardStatus,
	TransactionPriority,
} from "../types/enums.js";
import { UserDTO } from "./user.dto.js";

export namespace TransactionDTO {
	export const TypeNameSchema = z
		.string()
		.min(5, "Too short transaction type name")
		.max(255, "Too long transaction type name");

	export const TypeCreationSchema = z.object({ name: TypeNameSchema });

	const IdSchema = z.coerce.number().int().nonnegative();

	const PrioritySchema = z.enum(TransactionPriority, "Invalid priority");

	export const CreationSchema = z.object({
		title: z
			.string()
			.min(5, "Too short transaction title")
			.max(255, "Too long transaction title"),
		description: z.string().min(5, "Too short transaction description"),
		typeName: TypeNameSchema,
		priority: PrioritySchema.default(TransactionPriority.LOW),
	});

	export const UpdatesSchema = z
		.object({ ...CreationSchema.shape, priority: PrioritySchema })
		.partial()
		.refine((obj) => Object.keys(obj).length > 0, {
			message: "At least one modification must be provided",
		});

	export type Updates = z.infer<typeof UpdatesSchema>;

	export const UpdatingSchema = z.object({
		transactionId: IdSchema,
		updates: UpdatesSchema,
	});

	export const ForwardSchema = z.object({
		transactionId: IdSchema,
		status: z
			.enum(TransactionForwardStatus)
			.default(TransactionForwardStatus.WAITING),
		senderName: UserDTO.NameSchema,
		receiverName: UserDTO.NameSchema,
	});

	const InvalidMessage = "Invalid transaction identifier";
	export const TargetSchema = z.object({
		id: z.int(InvalidMessage).nonnegative(InvalidMessage),
	});

	export const UpdateForwardStatusSchema = z.object({
		transactionId: IdSchema,
		forwardId: IdSchema,
		status: z.enum(TransactionForwardStatus),
	});

	export const DeleteForwardSchema = z.object({
		transactionId: IdSchema,
		forwardId: IdSchema,
	});

	export const TargetDocumentSchema = z.object({
		id: IdSchema,
		userName: UserDTO.NameSchema,
		document: z
			.string()
			.regex(
				/^[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-\s]*[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]+[\u0621-\u064A\u0660-\u0669a-zA-Z0-9-_\s]*\.[a-zA-Z0-9]+$/g,
			)
			.toLowerCase(),
	});
}
