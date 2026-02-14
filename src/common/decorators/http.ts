import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';
import { ErrorCode } from '../enums/error-codes.enum.js';

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

interface SuccessResponseDef {
  status: number;
  description: string;
  type?: Type | [Type];
}

interface ErrorResponseDef {
  status: number;
  description: string;
  errorCode: ErrorCode;
  args?: Record<string, unknown>;
}

export type ApiResponseDef = SuccessResponseDef | ErrorResponseDef;

function isErrorResponse(def: ApiResponseDef): def is ErrorResponseDef {
  return 'errorCode' in def;
}

export function ApiResponses(...responses: ApiResponseDef[]) {
  const hasErrors = responses.some(isErrorResponse);

  const errorsByStatus = new Map<number, ErrorResponseDef[]>();
  const successResponses: SuccessResponseDef[] = [];

  for (const response of responses) {
    if (isErrorResponse(response)) {
      const group = errorsByStatus.get(response.status) ?? [];
      group.push(response);
      errorsByStatus.set(response.status, group);
    } else {
      successResponses.push(response);
    }
  }

  const decorators = successResponses.map((response) =>
    ApiResponse({
      status: response.status,
      type: response.type,
      description: response.description,
    }),
  );

  const _example = (status: number, error: ErrorResponseDef) => ({
    statusCode: status,
    message: {
      key: error.errorCode,
      ...(error.args && { args: error.args }),
    },
    error: STATUS_CODES[status] ?? 'Unknown Error',
  });

  for (const [status, errors] of errorsByStatus) {
    const isSingle = errors.length === 1;

    decorators.push(
      ApiResponse({
        status,
        description: isSingle ? errors[0].description : undefined,
        content: {
          'application/json': {
            schema: { $ref: getSchemaPath(HttpExceptionResponse) },
            ...(isSingle
              ? { example: _example(status, errors[0]) }
              : {
                  examples: Object.fromEntries(
                    errors.map((e) => [
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

  if (hasErrors) {
    decorators.push(ApiExtraModels(HttpExceptionResponse));
  }

  return applyDecorators(...decorators);
}
