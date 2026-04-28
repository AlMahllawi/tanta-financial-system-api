import { faker } from '@faker-js/faker';

import { uniqueFactory } from './factory.utils.js';

export const transactionTypeFactory = (creatorId: number) => {
  let name = `${faker.commerce.productName().replace(/[^a-zA-Z0-9-_\s]/g, '')} ${faker.string.alphanumeric(5)}`;
  while (name.length < 5) name += ` ${faker.string.alphanumeric(5)}`;

  return {
    name,
    creatorId,
  };
};

export const manyTransactionTypesFactory = (count: number, creatorId: number) =>
  uniqueFactory(count, () => transactionTypeFactory(creatorId), 'name');
