export const CHARACTERS = /[\p{Script=Arabic}\p{N}a-zA-Z-_\s]+/gu;

export const NAME_REGEX = new RegExp(
  `^${CHARACTERS.source}$`,
  CHARACTERS.flags,
);

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
