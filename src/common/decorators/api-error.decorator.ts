import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { HttpExceptionResponse } from '../responses/http-exception.response.js';
import { ErrorResponseDef } from '../interfaces/error-response.interface.js';

export function ApiErrorResponses(...errors: ErrorResponseDef[]) {
  const decorators = [];

  const _example = (status: number, error: ErrorResponseDef) =>
    HttpExceptionResponse.body(status, error.errorCode, error.args);

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

  return applyDecorators(...decorators);
}
