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

export function matchConstraintField(field: string) {
  return (meta: PrismaErrorMeta) => {
    const fields = getConstraintMeta(meta)?.fields;
    return Array.isArray(fields) && fields.includes(field);
  };
}

export function matchConstraintIndex(index: string) {
  return (meta: PrismaErrorMeta) => {
    return getConstraintMeta(meta)?.index === index;
  };
}

export function matchMessage(includes: string) {
  return (meta: PrismaErrorMeta) => {
    const message = meta.driverAdapterError?.cause?.message || '';
    return message.includes(includes);
  };
}

export function matchModelName(modelName: string) {
  return (meta: Record<string, unknown>) => {
    return meta?.modelName === modelName;
  };
}
