import { z } from "zod";

export const userNameSchema = z
	.string()
	.min(5, "Too short name")
	.max(255, "Too long name");
