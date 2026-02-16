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
import {
  ErrorResponseDef,
  PRISMA_ERROR_METADATA_KEY,
} from '../decorators/error.js';
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

    const metadata = this.reflector.get<ErrorResponseDef[]>(
      PRISMA_ERROR_METADATA_KEY,
      (host as unknown as ExecutionContext).getHandler(),
    );

    const errorDef = metadata?.find((def) => {
      if (!def.prisma) return false;
      if (def.prisma.error !== exception.code) return false;

      const prismaDef = def.prisma;
      if (prismaDef.matcher) {
        // Use the custom matcher function
        return prismaDef.matcher(
          (exception.meta as Record<string, unknown>) || {},
          exception,
        );
      }
      return true;
    });

    if (errorDef) {
      // Extract args from request if they exist
      const args: Record<string, unknown> = {};
      if (errorDef.args) {
        for (const key of Object.keys(errorDef.args)) {
          args[key] =
            (request.params as Record<string, unknown>)[key] ??
            (request.body as Record<string, unknown>)[key] ??
            (request.query as Record<string, unknown>)[key] ??
            errorDef.args[key];
        }
      }

      return response.status(errorDef.status).json({
        statusCode: errorDef.status,
        message: {
          key: errorDef.errorCode,
          args,
        },
        error: STATUS_CODES[errorDef.status] ?? 'Unknown Error',
      });
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
