import { uniqueFactory } from './factory.utils.js';
import { faker } from '@faker-js/faker';

export const budgetCategoryFactory = (
  overrides: {
    name?: string;
  } = {},
) => {
  let name = overrides.name ?? faker.commerce.department();
  while (name.length < 5) name += ` ${faker.commerce.department()}`;

  return {
    name,
  };
};

export const manyBudgetCategoriesFactory = (count: number) =>
  uniqueFactory(count, budgetCategoryFactory, 'name');
