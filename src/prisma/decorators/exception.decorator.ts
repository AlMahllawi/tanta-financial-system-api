import { Prisma } from '../../../prisma/generated/client.js';
import { ErrorArgsMap } from '../../common/constants/error-definitions.js';
import { ApiErrorResponses } from '../../common/decorators/api-error.decorator.js';
import { ErrorCode } from '../../common/enums/error-codes.enum.js';

export const PRISMA_ERROR_METADATA_KEY = 'prisma_error_metadata';

export interface PrismaErrorConstraintMeta {
  fields?: string[];
  index?: string;
}

export interface DriverAdapterErrorData {
  code?: string;
  meta?: Record<string, unknown>;
  cause?: {
    message?: string;
    code?: string;
    constraint?: PrismaErrorConstraintMeta;
  };
}

export interface DriverAdapterError
  extends Omit<Error, 'cause'>, DriverAdapterErrorData {
  name: 'DriverAdapterError';
  message: string;
}

export type PrismaMatcher = (
  error: Prisma.PrismaClientKnownRequestError | DriverAdapterError,
) => boolean;

export interface PrismaErrorMapping<T extends ErrorCode = ErrorCode> {
  errorCode: T;
  matchers: PrismaMatcher | PrismaMatcher[];
  /**
   * Optional callback to extract arguments for the error message from the request
   * and the prisma exception.
   *
   * @param params - The request parameters
   * @param body - The request body
   * @param query - The request query
   * @param exception - The Prisma exception that occurred
   * @returns A record of arguments for the error message
   */
  argExtractor: (
    params: Record<string, unknown>,
    body: Record<string, unknown>,
    query: Record<string, unknown>,
    exception: Prisma.PrismaClientKnownRequestError | DriverAdapterError,
  ) => ErrorArgsMap[T];
}

export function ApiPrismaErrorResponses(
  ...errors: PrismaErrorMapping<ErrorCode>[]
) {
  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) => {
    ApiErrorResponses(...errors.map((e) => e.errorCode))(
      target,
      key,
      descriptor,
    );

    const existing = (Reflect.getOwnMetadata(
      PRISMA_ERROR_METADATA_KEY,
      target,
      key,
    ) || []) as PrismaErrorMapping<ErrorCode>[];

    Reflect.defineMetadata(
      PRISMA_ERROR_METADATA_KEY,
      [...existing, ...errors],
      target,
      key,
    );
  };
}
