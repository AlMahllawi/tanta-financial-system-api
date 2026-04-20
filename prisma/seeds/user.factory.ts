import { uniqueFactory } from './factory.utils.js';
import { faker } from '@faker-js/faker';

import { UserRole } from '../generated/enums.js';
import { hash } from 'argon2';

const DEFAULT_USER_PASSWORD =
  process.env.DEFAULT_USER_PASSWORD ?? '5ecuredP@ssw0rd';

const _userFactory = (
  departmentName: string,
  hashedPassword: string,
  overrides: { name?: string; role?: UserRole } = {},
) => {
  let name = overrides.name ?? faker.person.fullName();
  while (name.length < 5) name += ` ${faker.person.firstName()}`;

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
