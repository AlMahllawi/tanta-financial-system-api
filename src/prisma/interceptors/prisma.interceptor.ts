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
import { Prisma } from '../../../prisma/generated/client.js';
import { HttpExceptionResponse } from '../../common/responses/http-exception.response.js';
import {
  PrismaErrorResponseDef,
  PRISMA_ERROR_METADATA_KEY,
} from '../decorators/exception.decorator.js';
import { STATUS_CODES } from 'node:http';
import { catchError, Observable, throwError } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class PrismaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception) => {
        if (!(exception instanceof Prisma.PrismaClientKnownRequestError))
          return throwError(() => exception as Error);

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        const handler = context.getHandler();

        // Get metadata from either the handler or the class prototype (where method decorators often store it)
        const metadata =
          this.reflector.get<PrismaErrorResponseDef[]>(
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
              (exception.meta as Record<string, unknown>) || {},
              exception,
            ),
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

          return throwError(
            () =>
              new HttpException(
                HttpExceptionResponse.body(
                  errorDef.status,
                  errorDef.errorCode,
                  args,
                ),
                errorDef.status,
              ),
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
