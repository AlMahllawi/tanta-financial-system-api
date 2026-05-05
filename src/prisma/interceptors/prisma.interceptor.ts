import { STATUS_CODES } from 'node:http';

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';

import { Prisma } from '../../../prisma/generated/client.js';
import { ErrorRegistry } from '../../common/constants/error-definitions.js';
import { HttpExceptionResponse } from '../../common/responses/http-exception.response.js';
import {
  DriverAdapterError,
  PRISMA_ERROR_METADATA_KEY,
  PrismaErrorMapping,
} from '../decorators/exception.decorator.js';

@Injectable()
export class PrismaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception: Error) => {
        if (
          !(
            exception instanceof Prisma.PrismaClientKnownRequestError ||
            exception.name === 'DriverAdapterError'
          )
        )
          return throwError(() => exception);

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        const handler = context.getHandler();

        // Get metadata from either the handler or the class prototype (where method decorators often store it)
        const metadata =
          this.reflector.get<PrismaErrorMapping[]>(
            PRISMA_ERROR_METADATA_KEY,
            handler,
          ) ??
          Reflect.getMetadata(
            PRISMA_ERROR_METADATA_KEY,
            context.getClass().prototype as object,
            handler.name,
          );

        const errorDef = metadata?.find((def) => {
          if (!def.matchers) return false;

          const matchers = Array.isArray(def.matchers)
            ? def.matchers
            : [def.matchers];
          if (matchers.length === 0) return false;

          return matchers.some((matcher) =>
            matcher(
              exception as
                | Prisma.PrismaClientKnownRequestError
                | DriverAdapterError,
            ),
          );
        });

        if (errorDef) {
          const registryDef = ErrorRegistry[errorDef.errorCode];
          const status = registryDef.status;

          const args = errorDef.argExtractor
            ? errorDef.argExtractor(
                request.params as Record<string, unknown>,
                request.body as Record<string, unknown>,
                request.query as Record<string, unknown>,
                exception as
                  | Prisma.PrismaClientKnownRequestError
                  | DriverAdapterError,
              )
            : (registryDef.args ?? {});

          return throwError(
            () =>
              new HttpException(
                HttpExceptionResponse.body(
                  status,
                  errorDef.errorCode,
                  args as Record<string, string>,
                ),
                status,
              ),
          );
        }

        this.logger.error(`Unhandled Prisma error`, {
          method: request.method,
          path: request.url,
          error: exception,
        });

        // Default fallback for unhandled Prisma errors
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: status,
                message: {
                  key: 'INTERNAL_SERVER_ERROR',
                },
                error: STATUS_CODES[status],
              },
              status,
            ),
        );
      }),
    );
  }
}
