import { faker } from '@faker-js/faker';

import { uniqueFactory } from './factory.utils.js';

export const departmentFactory = (
  overrides: {
    name?: string;
  } = {},
) => {
  const name = overrides.name
    ? overrides.name.replace(/[^a-zA-Z0-9-_\s]/g, '')
    : `${faker.commerce.department().replace(/[^a-zA-Z0-9-_\s]/g, '')} ${faker.string.alphanumeric(5)}`;

  return {
    name,
  };
};

export const manyDepartmentsFactory = (count: number) =>
  uniqueFactory(count, departmentFactory, 'name');
