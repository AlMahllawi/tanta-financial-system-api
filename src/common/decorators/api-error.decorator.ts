import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorResponseDef } from '../interfaces/error-response.interface.js';
import { HttpExceptionResponse } from '../responses/http-exception.response.js';

export const API_ERROR_METADATA_KEY = 'api_error_metadata';

export function ApiErrorResponses(...errors: ErrorResponseDef[]) {
  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) => {
    const existing = (Reflect.getOwnMetadata(
      API_ERROR_METADATA_KEY,
      target,
      key,
    ) || []) as ErrorResponseDef[];
    const allErrors = [...existing, ...errors];
    Reflect.defineMetadata(API_ERROR_METADATA_KEY, allErrors, target, key);

    const errorsByStatus = new Map<number, ErrorResponseDef[]>();
    for (const error of allErrors) {
      const group = errorsByStatus.get(error.status) ?? [];
      group.push(error);
      errorsByStatus.set(error.status, group);
    }

    ApiExtraModels(HttpExceptionResponse)(target, key, descriptor);

    for (const [status, errorsGroup] of errorsByStatus) {
      const isSingle = errorsGroup.length === 1;

      const _example = (status: number, error: ErrorResponseDef) =>
        HttpExceptionResponse.body(status, error.errorCode, error.args);

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
