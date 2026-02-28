import { faker } from '@faker-js/faker';
import { TransactionPriority } from '../generated/enums.js';

export const transactionFactory = (creatorId: number, typeName: string) => {
  return {
    title: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    typeName,
    creatorId,
    priority: faker.helpers.arrayElement(Object.values(TransactionPriority)),
    fulfilled: faker.datatype.boolean(0.2),
  };
};

export const manyTransactionsFactory = (
  count: number,
  creatorId: number,
  typeName: string,
) => {
  return Array.from({ length: count }, () =>
    transactionFactory(creatorId, typeName),
  );
};
