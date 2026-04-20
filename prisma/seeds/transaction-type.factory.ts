import { faker } from '@faker-js/faker';
import { uniqueFactory } from './factory.utils.js';

const _transactionTypeFactory = (creatorId: number) => {
  let name = faker.commerce.productName();
  while (name.length < 5) name += ` ${faker.commerce.productName()}`;

  return {
    name,
    creatorId,
  };
};

export const manyTransactionTypesFactory = (count: number, creatorId: number) =>
  uniqueFactory(count, () => _transactionTypeFactory(creatorId), 'name');
