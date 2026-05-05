import { HttpException, HttpStatus } from '@nestjs/common';

import { ErrorArgsMap } from '../constants/error-definitions.js';
import { ErrorCode } from '../enums/error-codes.enum.js';
import { HttpExceptionResponse } from '../responses/http-exception.response.js';

export class ApiException<T extends ErrorCode> extends HttpException {
  constructor(status: HttpStatus, errorCode: T, args?: ErrorArgsMap[T]) {
    super(
      HttpExceptionResponse.body(
        status,
        errorCode,
        args as Record<string, string>,
      ),
      status,
    );
  }
}
