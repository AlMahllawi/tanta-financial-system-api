import { Prisma } from '../../../prisma/generated/client.js';
import { ApiErrorResponses } from '../../common/decorators/api-error.decorator.js';
import { ErrorResponseDef } from '../../common/interfaces/error-response.interface.js';

export const PRISMA_ERROR_METADATA_KEY = 'prisma_error_metadata';

export type PrismaMatcher = (
  meta: Record<string, unknown>,
  error: Prisma.PrismaClientKnownRequestError,
) => boolean;

export interface PrismaErrorResponseDef extends ErrorResponseDef {
  matchers: PrismaMatcher | PrismaMatcher[];
}

export function ApiPrismaErrorResponses(...errors: PrismaErrorResponseDef[]) {
  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) => {
    ApiErrorResponses(...errors)(target, key, descriptor);

    const existing = (Reflect.getOwnMetadata(
      PRISMA_ERROR_METADATA_KEY,
      target,
      key,
    ) || []) as PrismaErrorResponseDef[];

    Reflect.defineMetadata(
      PRISMA_ERROR_METADATA_KEY,
      [...existing, ...errors],
      target,
      key,
    );
  };
}
