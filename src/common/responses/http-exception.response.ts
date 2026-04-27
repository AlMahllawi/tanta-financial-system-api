import { STATUS_CODES } from 'node:http';

import { ApiProperty } from '@nestjs/swagger';

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

  static body(
    status: number,
    errorCode: ErrorCode,
    args?: Record<string, unknown>,
  ): HttpExceptionResponse {
    return {
      statusCode: status,
      message: {
        key: errorCode,
        ...(args && { args }),
      },
      error: STATUS_CODES[status] ?? 'Unknown Error',
    };
  }
}
