import { STATUS_CODES } from 'node:http';

import { ApiProperty } from '@nestjs/swagger';

export class I18nMessage<
  TErrorCode extends string = string,
  TArgs extends Record<string, string> = Record<string, string>,
> {
  @ApiProperty()
  key: TErrorCode;
  @ApiProperty({ required: false })
  args?: TArgs;
}

export class HttpExceptionResponse<
  TErrorCode extends string = string,
  TArgs extends Record<string, string> = Record<string, string>,
> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: I18nMessage<TErrorCode, TArgs>;

  @ApiProperty()
  error: string;

  static body<
    TErrorCode extends string = string,
    TArgs extends Record<string, string> = Record<string, string>,
  >(
    status: number,
    errorCode: TErrorCode,
    args?: TArgs,
  ): HttpExceptionResponse<TErrorCode, TArgs> {
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
