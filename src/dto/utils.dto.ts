import { z } from "zod";

export namespace UtilsDTO {
	export const Paging = z.object({
		pageNumber: z.coerce.number().int().min(1).default(1),
		pageSize: z.coerce.number().int().min(2).max(100).default(10),
	});
}
