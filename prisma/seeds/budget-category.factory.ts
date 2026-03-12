import { uniqueFactory } from './factory.utils.js';
import { faker } from '@faker-js/faker';

export const budgetCategoryFactory = (
  overrides: {
    name?: string;
  } = {},
) => {
  const name = overrides.name ?? faker.commerce.department();
  return {
    name,
  };
};

export const manyBudgetCategoriesFactory = (count: number) =>
  uniqueFactory(count, budgetCategoryFactory, 'name');
