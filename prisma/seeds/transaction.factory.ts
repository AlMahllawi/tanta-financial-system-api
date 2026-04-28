import { faker } from '@faker-js/faker';

import { TransactionPriority } from '../generated/enums.js';

export const transactionFactory = (
  creatorId: number,
  typeName: string,
  overrides: {
    title?: string;
    description?: string;
    priority?: TransactionPriority;
    fulfilled?: boolean;
  } = {},
) => {
  let title = overrides.title ?? faker.commerce.productName();
  while (title.length < 5) title += ` ${faker.commerce.productName()}`;

  return {
    title,
    description: overrides.description ?? faker.lorem.sentence(),
    typeName,
    creatorId,
    priority:
      overrides.priority ??
      faker.helpers.arrayElement(Object.values(TransactionPriority)),
    fulfilled: overrides.fulfilled ?? faker.datatype.boolean(0.2),
  };
};

export const manyTransactionsFactory = (
  count: number,
  creatorId: number,
  typeName: string,
) =>
  Array.from({ length: count }, () => transactionFactory(creatorId, typeName));
