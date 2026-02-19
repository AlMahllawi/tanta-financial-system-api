import { ErrorCode } from '../enums/error-codes.enum.js';

export interface ErrorResponseDef {
  status: number;
  description: string;
  errorCode: ErrorCode;
  args?: Record<string, unknown>;
}
