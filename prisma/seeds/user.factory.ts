import { faker } from '@faker-js/faker';
import { hash } from 'argon2';

import { UserRole } from '../generated/enums.js';
import { uniqueFactory } from './factory.utils.js';

const DEFAULT_USER_PASSWORD =
  process.env.DEFAULT_USER_PASSWORD ?? '5ecuredP@ssw0rd';

const _userFactory = (
  departmentName: string,
  hashedPassword: string,
  overrides: { name?: string; role?: UserRole } = {},
) => {
  let name = (
    overrides.name ?? `${faker.person.firstName()} ${faker.person.lastName()}`
  ).replace(/[^a-zA-Z0-9-_\s]/g, '');
  while (name.length < 5)
    name += ` ${faker.person.firstName().replace(/[^a-zA-Z0-9-_\s]/g, '')}`;

  return {
    name,
    hashedPassword,
    role: overrides.role ?? UserRole.USER,
    departmentName,
  };
};

export const userFactory = async (
  departmentName: string,
  overrides: { name?: string; role?: UserRole; password?: string } = {},
) =>
  _userFactory(
    departmentName,
    await hash(overrides.password ?? DEFAULT_USER_PASSWORD),
    overrides,
  );

export const manyUsersFactory = async (
  count: number,
  departmentName: string,
  overrides: { name?: string; role?: UserRole; password?: string } = {},
) => {
  const hashedPassword = await hash(
    overrides.password ?? DEFAULT_USER_PASSWORD,
  );
  return uniqueFactory(
    count,
    () => _userFactory(departmentName, hashedPassword, overrides),
    'name',
  );
};
