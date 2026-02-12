export const CHARACTERS = /[\p{Script=Arabic}\p{N}a-zA-Z-_\s]+/gu;

export const NAME_REGEX = new RegExp(
  `^${CHARACTERS.source}$`,
  CHARACTERS.flags,
);

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const DURATION_REGEX =
  /^(\d+\.?\d*|\.\d+)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?|w|weeks?|y|years?)$/i;
