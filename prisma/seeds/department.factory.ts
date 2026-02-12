import { uniqueFactory } from './factory.utils.js';
import { faker } from '@faker-js/faker';

export const departmentFactory = (
  overrides: {
    name?: string;
  } = {},
) => {
  const name = overrides.name ?? faker.commerce.department();
  return {
    name,
  };
};

export const manyDepartmentsFactory = (count: number) => {
  return uniqueFactory(count, departmentFactory, 'name');
};
