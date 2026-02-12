import 'dotenv/config';
import Joi from 'joi';
import { PrismaClient } from './generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserRole } from './generated/enums.js';
import {
  departmentFactory,
  manyDepartmentsFactory,
} from './seeds/department.factory.js';
import { manyUsersFactory, userFactory } from './seeds/user.factory.js';
import { faker } from '@faker-js/faker';

interface EnvVars {
  DEFAULT_ADMIN_NAME: string;
  DEFAULT_ADMIN_PASSWORD: string;
  DEFAULT_ADMIN_DEPARTMENT: string;
  DATABASE_URL: string;
  NODE_ENV: string;
}

const envSchema = Joi.object({
  DEFAULT_ADMIN_NAME: Joi.string().required(),
  DEFAULT_ADMIN_PASSWORD: Joi.string().required(),
  DEFAULT_ADMIN_DEPARTMENT: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
}).unknown(true);

const validationResult = envSchema.validate(process.env);

if (validationResult.error)
  throw new Error(`Config validation error: ${validationResult.error.message}`);

const ENV = validationResult.value as EnvVars;

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Creating essential administrations...');
  const adminDeptData = departmentFactory({
    name: ENV.DEFAULT_ADMIN_DEPARTMENT,
  });

  const administrationDepartment = await prisma.department.upsert({
    where: { name: adminDeptData.name },
    update: {},
    create: adminDeptData,
  });

  console.log(
    `Created administration "${administrationDepartment.name}" department.`,
  );

  const adminUserData = await userFactory(administrationDepartment.name, {
    name: ENV.DEFAULT_ADMIN_NAME,
    password: ENV.DEFAULT_ADMIN_PASSWORD,
    role: UserRole.ADMIN,
  });

  const admin = await prisma.user.upsert({
    where: { name: adminUserData.name },
    update: {},
    create: adminUserData,
  });

  console.log(`Created admin "${admin.name}" user.`);

  await prisma.department.update({
    where: { name: administrationDepartment.name },
    data: { managerName: admin.name },
  });

  console.log('Essential seed completed.');

  if (ENV.NODE_ENV === 'production')
    return console.log('Skipping test seeds (in production environment).');

  console.log('Running test seeds for development...');

  console.log('Creating departments...');
  const departments = manyDepartmentsFactory(
    faker.number.int({ min: 5, max: 10 }),
  );

  await prisma.department.createMany({
    data: departments,
    skipDuplicates: true,
  });

  const usersCounts = departments.map(() =>
    faker.number.int({ min: 10, max: 20 }),
  );
  const totalUsersCount = usersCounts.reduce((sum, count) => sum + count, 0);

  console.log(`Generating ${totalUsersCount} unique users...`);

  const allUsers = await manyUsersFactory(totalUsersCount, departments[0].name);

  let currentOffset = 0;
  const departmentConfigs = departments.map((department, i) => {
    const count = usersCounts[i];
    const start = currentOffset;
    currentOffset += count;
    return {
      department,
      users: allUsers.slice(start, start + count).map((user) => ({
        ...user,
        departmentName: department.name,
      })),
    };
  });

  await Promise.all(
    departmentConfigs.map(async ({ department, users }) => {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: users,
          skipDuplicates: true,
        });

        const manager = faker.helpers.arrayElement(users);

        await tx.department.update({
          where: { name: department.name },
          data: { managerName: manager.name },
        });

        console.log(
          `Created department "${department.name}" with ${users.length} users (Manager: "${manager.name}")`,
        );
      });
    }),
  );

  console.log(
    `Created ${departments.length} departments with ${totalUsersCount} users.`,
  );

  console.log('Test seeds completed.');
}

console.log('Seeding starting...');
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seeding finished.');
  });
