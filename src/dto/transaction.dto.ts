import { z } from "zod";

export namespace TransactionDTO {
	export const NameSchema = z
		.string()
		.min(5, "Too short transaction name")
		.max(255, "Too long transaction name");

	export const TypeCreationSchema = z.object({ name: NameSchema });
}
