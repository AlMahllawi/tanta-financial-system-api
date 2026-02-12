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

  const decorators = responses.map((response) => {
    if (isErrorResponse(response)) {
      return ApiResponse({
        status: response.status,
        description: response.description,
        content: {
          'application/json': {
            schema: { $ref: getSchemaPath(HttpExceptionResponse) },
            example: {
              statusCode: response.status,
              message: {
                key: response.errorCode,
                ...(response.args && { args: response.args }),
              },
              error: STATUS_CODES[response.status] ?? 'Unknown Error',
            },
          },
        },
      });
    }

    return ApiResponse({
      status: response.status,
      type: response.type,
      description: response.description,
    });
  });

  if (hasErrors) {
    decorators.push(ApiExtraModels(HttpExceptionResponse));
  }

  return applyDecorators(...decorators);
}
