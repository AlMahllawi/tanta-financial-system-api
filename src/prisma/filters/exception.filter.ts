import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '../../../prisma/generated/client.js';
import { HttpExceptionResponse } from '../../common/responses/http-exception.response.js';
import {
  PrismaErrorResponseDef,
  PRISMA_ERROR_METADATA_KEY,
} from '../decorators/exception.decorator.js';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  constructor(private reflector: Reflector) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const handler = (host as unknown as ExecutionContext).getHandler();

    const metadata = handler
      ? this.reflector.get<PrismaErrorResponseDef[]>(
          PRISMA_ERROR_METADATA_KEY,
          handler,
        )
      : undefined;

    const errorDef = metadata?.find((def) => {
      if (!def.matchers) return false;

      const matchers = Array.isArray(def.matchers)
        ? def.matchers
        : [def.matchers];
      if (matchers.length === 0) return false;

      return matchers.some((matcher) =>
        matcher((exception.meta as Record<string, unknown>) || {}, exception),
      );
    });

    if (errorDef) {
      // Extract args from request if they exist
      const args: Record<string, unknown> = {};
      if (errorDef.args)
        for (const key of Object.keys(errorDef.args))
          args[key] =
            (request.params as Record<string, unknown>)[key] ??
            (request.body as Record<string, unknown>)[key] ??
            (request.query as Record<string, unknown>)[key] ??
            errorDef.args[key];

      return response
        .status(errorDef.status)
        .json(
          HttpExceptionResponse.body(errorDef.status, errorDef.errorCode, args),
        );
    }

    this.logger.error(
      `Unhandled Prisma error: ${exception.code}`,
      exception.stack,
      {
        meta: exception.meta,
        path: request.url,
        method: request.method,
      },
    );

    // Default fallback for unhandled Prisma errors
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return response.status(status).json({
      statusCode: status,
      message: {
        key: 'INTERNAL_SERVER_ERROR',
      },
      error: STATUS_CODES[status],
    });
  }
}
