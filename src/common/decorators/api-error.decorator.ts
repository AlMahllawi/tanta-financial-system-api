import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorRegistry } from '../constants/error-definitions.js';
import { ErrorCode } from '../enums/error-codes.enum.js';
import { HttpExceptionResponse } from '../responses/http-exception.response.js';

export const API_ERROR_METADATA_KEY = 'api_error_metadata';

interface ApiErrorMetadata {
  status: number;
  description: string;
  errorCode: ErrorCode;
  args?: Record<string, unknown>;
}

export function ApiErrorResponses(...errorCodes: ErrorCode[]) {
  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) => {
    const fullErrors = errorCodes.map((errorCode) => {
      const def = ErrorRegistry[errorCode];
      if (!def)
        throw new Error(
          `Error code "${errorCode}" not found in ErrorRegistry. Please check your spelling or add it to error-definitions.ts`,
        );

      return {
        status: def.status,
        description: def.description,
        errorCode,
        args: def.args,
      };
    });

    const existing = (Reflect.getOwnMetadata(
      API_ERROR_METADATA_KEY,
      target,
      key,
    ) || []) as ApiErrorMetadata[];
    const allErrors = [...existing, ...fullErrors];
    Reflect.defineMetadata(API_ERROR_METADATA_KEY, allErrors, target, key);

    const errorsByStatus = new Map<number, ApiErrorMetadata[]>();
    for (const error of allErrors) {
      if (error.status === undefined) continue;
      const group = errorsByStatus.get(error.status) ?? [];
      group.push(error);
      errorsByStatus.set(error.status, group);
    }

    ApiExtraModels(HttpExceptionResponse)(target, key, descriptor);

    for (const [status, errorsGroup] of errorsByStatus) {
      const isSingle = errorsGroup.length === 1;

      const _example = (status: number, error: ApiErrorMetadata) =>
        HttpExceptionResponse.body(
          status,
          error.errorCode,
          error.args as Record<string, string>,
        );

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
      })(target, key, descriptor);
    }
  };
}
