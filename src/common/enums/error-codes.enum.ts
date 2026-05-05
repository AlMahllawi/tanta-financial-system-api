import { ErrorMetadata } from '../constants/error-metadata.js';

/**
 * The ErrorCode list is automatically derived from the ErrorMetadata keys.
 * This ensures that adding a new error to the metadata automatically makes its code available.
 */
export const ErrorCode = Object.freeze(
  Object.keys(ErrorMetadata).reduce(
    (acc, key) => {
      acc[key] = key;
      return acc;
    },
    {} as Record<string, string>,
  ) as { [K in keyof typeof ErrorMetadata]: K },
);

export type ErrorCode = keyof typeof ErrorMetadata;
