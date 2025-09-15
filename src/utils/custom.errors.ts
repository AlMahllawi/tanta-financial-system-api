export class ExpectedError extends Error {
	constructor(
		public code: string,
		...args: ConstructorParameters<typeof Error>
	) {
		super(...args);
		this.name = "ExpectedError";
		Object.setPrototypeOf(this, ExpectedError.prototype);
	}
}
