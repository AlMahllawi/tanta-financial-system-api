abstract class BaseCustomException extends Error {
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

export namespace Exceptions {
	export class Conflict extends BaseCustomException {}

	export class InvalidCredentials extends BaseCustomException {}

	export class Unauthorized extends BaseCustomException {}
}
