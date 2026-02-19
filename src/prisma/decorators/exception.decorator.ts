import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { ApiErrorResponses } from '../../common/decorators/api-error.decorator.js';
import { ErrorResponseDef } from '../../common/interfaces/error-response.interface.js';

export const PRISMA_ERROR_METADATA_KEY = 'prisma_error_metadata';

export interface PrismaErrorDef {
  error: string;
  matcher?: (
    meta: Record<string, unknown>,
    error: Prisma.PrismaClientKnownRequestError,
  ) => boolean;
}

export interface PrismaErrorResponseDef extends ErrorResponseDef {
  prisma: PrismaErrorDef;
}

export function ApiPrismaErrorResponses(...errors: PrismaErrorResponseDef[]) {
  return applyDecorators(
    ApiErrorResponses(...errors),
    SetMetadata(PRISMA_ERROR_METADATA_KEY, errors),
  );
}
