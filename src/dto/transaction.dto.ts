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

	const TransactionIdSchema = z.int().nonnegative();

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
		transactionId: TransactionIdSchema,
		updates: UpdatesSchema,
	});

	export const ForwardSchema = z.object({
		transactionId: TransactionIdSchema,
		status: z
			.enum(TransactionForwardStatus)
			.default(TransactionForwardStatus.WAITING),
		senderName: UserDTO.NameSchema,
		receiverName: UserDTO.NameSchema,
	});

	const InvalidMessage = "Invalid transaction identifier";
	export const ViewSchema = z.object({
		id: z.int(InvalidMessage).nonnegative(InvalidMessage),
	});
}
