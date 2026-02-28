import { faker } from '@faker-js/faker';
import { uniqueFactory } from './factory.utils.js';

const _transactionTypeFactory = (creatorId: number) => {
  return {
    name: faker.commerce.productName(),
    creatorId,
  };
};

export const manyTransactionTypesFactory = (
  count: number,
  creatorId: number,
) => {
  return uniqueFactory(count, () => _transactionTypeFactory(creatorId), 'name');
};
