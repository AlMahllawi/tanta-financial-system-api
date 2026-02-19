import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-codes.enum.js';
import { HttpExceptionResponse } from '../responses/http-exception.response.js';

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    errorCode: ErrorCode,
    args?: Record<string, unknown>,
  ) {
    super(HttpExceptionResponse.body(status, errorCode, args), status);
  }
}
