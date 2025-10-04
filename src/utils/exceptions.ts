export abstract class BaseCustomException extends Error {
	constructor(
		message: string,
		public readonly context?: any,
	) {
		super(message);

		Object.setPrototypeOf(this, new.target.prototype);
		this.name = new.target.name;

		Error.captureStackTrace?.(this, new.target);
	}
}

// TODO: remove

export namespace Exceptions {
	export class Invalid extends BaseCustomException {}

	export class Conflict extends BaseCustomException {}

	export class Unauthorized extends BaseCustomException {}

	export class Forbidden extends BaseCustomException {}
}
