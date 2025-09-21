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

	export const CreationSchema = z.object({
		title: z
			.string()
			.min(5, "Too short transaction title")
			.max(255, "Too long transaction title"),
		description: z.string().min(5, "Too short transaction description"),
		type: TypeNameSchema,
		priority: z
			.enum(TransactionPriority, "Invalid priority")
			.default(TransactionPriority.LOW),
	});

	export const ForwardSchema = z.object({
		transactionId: z.int(),
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
