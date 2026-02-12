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
}

export function ApiExceptionResponse(
  statusCode: number,
  error: string,
  errorCode: ErrorCode,
  args?: Record<string, unknown>,
) {
  class CustomHttpExceptionResponse extends HttpExceptionResponse {
    @ApiProperty({ example: statusCode })
    declare statusCode: number;

    @ApiProperty({
      example: {
        key: errorCode,
        ...(args && { args }),
      },
    })
    declare message: I18nMessage;

    @ApiProperty({ example: error })
    declare error: string;
  }

  Object.defineProperty(CustomHttpExceptionResponse, 'name', {
    value: `${errorCode.replace(/_/g, '')}Response`,
  });

  return CustomHttpExceptionResponse;
}
