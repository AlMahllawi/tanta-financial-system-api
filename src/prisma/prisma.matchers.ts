import { PrismaError } from 'prisma-error-enum';

import { Prisma } from '../../prisma/generated/client.js';
import {
  DriverAdapterError,
  DriverAdapterErrorData,
  PrismaErrorConstraintMeta,
  PrismaMatcher,
} from './decorators/exception.decorator.js';

type GenericError = Prisma.PrismaClientKnownRequestError | DriverAdapterError;

interface PrismaErrorMeta {
  driverAdapterError?: DriverAdapterErrorData;
  modelName?: string;
}

function getConstraintMeta(
  meta: PrismaErrorMeta,
): PrismaErrorConstraintMeta | undefined {
  return meta.driverAdapterError?.cause?.constraint;
}

export function matchUniqueConstraint(field: string): PrismaMatcher {
  return (error: GenericError) => {
    if (error.name === 'DriverAdapterError') return false;
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError.code !== PrismaError.UniqueConstraintViolation)
      return false;
    const meta = prismaError.meta as PrismaErrorMeta;
    const fields = getConstraintMeta(meta)?.fields;
    return Array.isArray(fields) && fields.includes(field);
  };
}

export function matchForeignConstraint(index: string): PrismaMatcher {
  return (error: GenericError) => {
    if (error.name === 'DriverAdapterError') return false;
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError.code !== PrismaError.ForeignConstraintViolation)
      return false;
    const meta = prismaError.meta as PrismaErrorMeta;
    const metaIndex = getConstraintMeta(meta)?.index;
    if (metaIndex === index) return true;
    const rawMessage = meta.driverAdapterError?.cause?.message || '';
    return rawMessage.includes(index);
  };
}

export function matchRecordsNotFound(modelName: string): PrismaMatcher {
  return (error: GenericError) => {
    if (error.name === 'DriverAdapterError') return false;
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError.code !== PrismaError.RecordsNotFound) return false;
    const meta = prismaError.meta as PrismaErrorMeta;
    return meta?.modelName === modelName;
  };
}

export function matchDriverAdapter(
  code: string,
  includes?: string,
): PrismaMatcher {
  return (error: GenericError) => {
    let adapterError: DriverAdapterError | undefined;
    if (error.name === 'DriverAdapterError')
      adapterError = error as DriverAdapterError;
    else {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      adapterError = prismaError.meta?.driverAdapterError as
        | DriverAdapterError
        | undefined;
    }

    if (!adapterError) return false;

    return (
      (adapterError.cause?.code === code &&
        (includes ? adapterError.cause?.message?.includes(includes) : true)) ??
      false
    );
  };
}
