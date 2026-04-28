import { faker } from '@faker-js/faker';

import { uniqueFactory } from './factory.utils.js';

export const departmentFactory = (
  overrides: {
    name?: string;
  } = {},
) => {
  let name = `${(overrides.name ?? faker.commerce.department()).replace(/[^a-zA-Z0-9-_\s]/g, '')} ${faker.string.alphanumeric(5)}`;
  while (name.length < 5) name += ` ${faker.string.alphanumeric(5)}`;

  return {
    name,
  };
};

export const manyDepartmentsFactory = (count: number) =>
  uniqueFactory(count, departmentFactory, 'name');
