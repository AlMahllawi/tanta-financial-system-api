import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';
import { ErrorCode } from '../enums/error-codes.enum.js';

export const PRISMA_ERROR_METADATA_KEY = 'prisma_error_metadata';

export class I18nMessage {
  @ApiProperty()
  key: ErrorCode;
  @ApiProperty({ required: false })
  args?: Record<string, unknown>;
}

export class HttpExceptionResponse {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: I18nMessage;

  @ApiProperty()
  error: string;
}

export interface ErrorResponseDef {
  status: number;
  description: string;
  errorCode: ErrorCode;
  args?: Record<string, unknown>;
  prisma?: {
    error: string;
    matcher?: (
      meta: Record<string, unknown>,
      error: Prisma.PrismaClientKnownRequestError,
    ) => boolean;
  };
}

export function ApiErrorResponses(...errors: ErrorResponseDef[]) {
  const decorators = [];

  const _example = (status: number, error: ErrorResponseDef) => ({
    statusCode: status,
    message: {
      key: error.errorCode,
      ...(error.args && { args: error.args }),
    },
    error: STATUS_CODES[status] ?? 'Unknown Error',
  });

  const errorsByStatus = new Map<number, ErrorResponseDef[]>();
  for (const error of errors) {
    const group = errorsByStatus.get(error.status) ?? [];
    group.push(error);
    errorsByStatus.set(error.status, group);
  }

  for (const [status, errorsGroup] of errorsByStatus) {
    const isSingle = errorsGroup.length === 1;

    decorators.push(
      ApiResponse({
        status,
        description: isSingle ? errorsGroup[0].description : undefined,
        content: {
          'application/json': {
            schema: { $ref: getSchemaPath(HttpExceptionResponse) },
            ...(isSingle
              ? { example: _example(status, errorsGroup[0]) }
              : {
                  examples: Object.fromEntries(
                    errorsGroup.map((e) => [
                      e.errorCode,
                      { summary: e.description, value: _example(status, e) },
                    ]),
                  ),
                }),
          },
        },
      }),
    );
  }

  decorators.push(ApiExtraModels(HttpExceptionResponse));
  decorators.push(
    SetMetadata(
      PRISMA_ERROR_METADATA_KEY,
      errors.filter((e) => e.prisma),
    ),
  );

  return applyDecorators(...decorators);
}
