export const NameRegExp = /[\p{Script=Arabic}\p{N}a-zA-Z-_\s]+/gu;
export const IsNameRegExp = new RegExp(
	`^${NameRegExp.source}$`,
	NameRegExp.flags,
);
