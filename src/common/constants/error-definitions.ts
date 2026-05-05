import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-codes.enum.js';
import { ErrorMetadata as RawMetadata } from './error-metadata.js';

/**
 * The ErrorRegistry provides the full metadata for any given ErrorCode.
 */
export const ErrorRegistry: Record<
  ErrorCode,
  { status: HttpStatus; description: string; args?: Record<string, unknown> }
> = RawMetadata;

export type ErrorArgsMap = {
  [K in ErrorCode]: (typeof RawMetadata)[K] extends {
    args: infer A;
  }
    ? { [P in keyof A]: string }
    : Record<string, never>;
};
