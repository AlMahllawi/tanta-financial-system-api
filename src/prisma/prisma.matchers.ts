import { PrismaError } from 'prisma-error-enum';
import { Prisma } from '../../prisma/generated/client.js';
import { PrismaMatcher } from './decorators/exception.decorator.js';

interface PrismaErrorConstraintMeta {
  fields?: string[];
  index?: string;
  [key: string]: unknown;
}

interface PrismaErrorMeta {
  driverAdapterError?: {
    cause?: {
      message?: string;
      constraint?: PrismaErrorConstraintMeta;
    };
  };
  [key: string]: unknown;
}

function getConstraintMeta(
  meta: PrismaErrorMeta,
): PrismaErrorConstraintMeta | undefined {
  return meta.driverAdapterError?.cause?.constraint;
}

export function matchUniqueConstraint(field: string): PrismaMatcher {
  return (
    meta: PrismaErrorMeta,
    error: Prisma.PrismaClientKnownRequestError,
  ) => {
    if (error.code !== PrismaError.UniqueConstraintViolation) return false;
    const fields = getConstraintMeta(meta)?.fields;
    return Array.isArray(fields) && fields.includes(field);
  };
}

export function matchForeignConstraint(index: string): PrismaMatcher {
  return (
    meta: PrismaErrorMeta,
    error: Prisma.PrismaClientKnownRequestError,
  ) => {
    if (error.code !== PrismaError.ForeignConstraintViolation) return false;
    // 1. Check normalized meta (from Wrapped errors)
    const metaIndex = getConstraintMeta(meta)?.index;
    if (metaIndex === index) return true;

    // 2. Fallback: Parse the raw message (for Standalone errors)
    const rawMessage = meta.driverAdapterError?.cause?.message || '';
    return rawMessage.includes(index);
  };
}

export function matchRecordsNotFound(modelName: string): PrismaMatcher {
  return (
    meta: Record<string, unknown>,
    error: Prisma.PrismaClientKnownRequestError,
  ) => {
    if (error.code !== PrismaError.RecordsNotFound) return false;
    return meta?.modelName === modelName;
  };
}

export function matchMessage(
  includes: string,
  errorCode?: string,
): PrismaMatcher {
  return (
    meta: PrismaErrorMeta,
    error: Prisma.PrismaClientKnownRequestError,
  ) => {
    if (errorCode && error.code !== errorCode) return false;
    const message = meta.driverAdapterError?.cause?.message || '';
    return message.includes(includes);
  };
}
