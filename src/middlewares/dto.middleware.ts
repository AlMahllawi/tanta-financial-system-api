import { plainToInstance } from "class-transformer";
import type { ValidationError } from "class-validator";
import { validate } from "class-validator";
import type { NextFunction, Request, Response } from "express";

// biome-ignore lint/suspicious/noExplicitAny: DTO classes could be any
export default function (dtoClass: any) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const dtoInstance = plainToInstance(dtoClass, req.body);
		const errors = await validate(dtoInstance);

		if (errors.length > 0) {
			const errorMessages = errors.map((error: ValidationError) =>
				Object.values(error.constraints || {}).join(", "),
			);
			return res.status(400).json({ errors: errorMessages });
		}

		req.body = dtoInstance;
		next();
	};
}
