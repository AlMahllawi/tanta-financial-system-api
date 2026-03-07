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
import { manyDocumentsFactory } from './seeds/document.factory.js';
import { manyTransactionTypesFactory } from './seeds/transaction-type.factory.js';
import { manyTransactionsFactory } from './seeds/transaction.factory.js';
import { transactionForwardFactory } from './seeds/transaction-forward.factory.js';

interface EnvVars {
  DEFAULT_ADMIN_NAME: string;
  DEFAULT_ADMIN_PASSWORD: string;
  DEFAULT_ADMIN_DEPARTMENT: string;

  DEFAULT_ACCOUNTANT_NAME: string;
  DEFAULT_ACCOUNTANT_PASSWORD: string;
  DEFAULT_ACCOUNTANT_DEPARTMENT: string;

  DATABASE_URL: string;
  NODE_ENV: string;
}

const envSchema = Joi.object({
  DEFAULT_ADMIN_NAME: Joi.string().required(),
  DEFAULT_ADMIN_PASSWORD: Joi.string().required(),
  DEFAULT_ADMIN_DEPARTMENT: Joi.string().required(),

  DEFAULT_ACCOUNTANT_NAME: Joi.string().required(),
  DEFAULT_ACCOUNTANT_PASSWORD: Joi.string().required(),
  DEFAULT_ACCOUNTANT_DEPARTMENT: Joi.string().required(),

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
    data: { managerId: admin.id },
  });

  const accountantDeptData = departmentFactory({
    name: ENV.DEFAULT_ACCOUNTANT_DEPARTMENT,
  });

  const accountancyDepartment = await prisma.department.upsert({
    where: { name: accountantDeptData.name },
    update: {},
    create: accountantDeptData,
  });

  console.log(
    `Created accountancy "${accountancyDepartment.name}" department.`,
  );

  const accountantUserData = await userFactory(accountancyDepartment.name, {
    name: ENV.DEFAULT_ACCOUNTANT_NAME,
    password: ENV.DEFAULT_ACCOUNTANT_PASSWORD,
    role: UserRole.USER,
  });

  const accountant = await prisma.user.upsert({
    where: { name: accountantUserData.name },
    update: {},
    create: accountantUserData,
  });

  console.log(`Created accountant "${accountant.name}" user.`);

  await prisma.department.update({
    where: { name: accountancyDepartment.name },
    data: { managerId: accountant.id },
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

        const managerName = faker.helpers.arrayElement(users).name;
        const manager = await tx.user.findUnique({
          where: { name: managerName },
        });

        await tx.department.update({
          where: { name: department.name },
          data: { managerId: manager!.id },
        });

        console.log(
          `Created department "${department.name}" with ${users.length} users (Manager: "${managerName}")`,
        );
      });
    }),
  );

  console.log(
    `Created ${departments.length} departments with ${totalUsersCount} users.`,
  );

  console.log('Fetching created users to seed transactions and documents...');
  const users = await prisma.user.findMany({
    where: { id: { not: accountant.id } },
  });

  console.log(
    `Seeding documents, transaction types, and transactions for ${users.length} users...`,
  );
  for (const user of users) {
    const docsData = manyDocumentsFactory(
      faker.number.int({ min: 5, max: 10 }),
      user.id,
    );
    await prisma.document.createMany({ data: docsData });

    let userDocs = await prisma.document.findMany({
      where: { uploaderId: user.id },
    });

    if (userDocs.length === 0)
      userDocs = await prisma.document.findMany({ take: 10 });

    if (userDocs.length === 0) {
      console.warn(`Skipping user ${user.name} as no documents are available.`);
      continue;
    }

    const typesData = manyTransactionTypesFactory(
      faker.number.int({ min: 1, max: 2 }),
      user.id,
    );
    await prisma.transactionType.createMany({
      data: typesData,
      skipDuplicates: true,
    });

    const allTypes = await prisma.transactionType.findMany();

    if (allTypes.length === 0) {
      console.warn(
        `Skipping user ${user.name} as no transaction types are available.`,
      );
      continue;
    }

    const txCount = faker.number.int({ min: 2, max: 5 });
    const typesToUse = allTypes.filter((type) => type.creatorId === user.id);

    while (typesToUse.length < txCount)
      typesToUse.push(faker.helpers.arrayElement(allTypes));

    for (let i = 0; i < typesToUse.length; i++) {
      const type = typesToUse[i];
      const txData = manyTransactionsFactory(1, user.id, type.name)[0];
      const tx = await prisma.transaction.create({ data: txData });

      const docsToAttach = faker.helpers.arrayElements(
        userDocs,
        faker.number.int({ min: 1, max: 3 }),
      );
      await prisma.transactionDocument.createMany({
        data: docsToAttach.map((doc) => ({
          transactionId: tx.id,
          documentId: doc.id,
          attachedBy: user.id,
        })),
      });
    }
  }

  console.log('Seeding transaction forwards (chains)...');
  const allTransactions = await prisma.transaction.findMany();
  for (const tx of allTransactions) {
    const chainLength = faker.number.int({ min: 2, max: 10 });
    const chainUsers = faker.helpers.arrayElements(users, chainLength);

    if (tx.fulfilled) chainUsers.push(accountant);

    if (chainUsers.length < 2) continue;

    for (let i = 0; i < chainUsers.length - 1; i++) {
      const sender = chainUsers[i];
      const receiver = chainUsers[i + 1];
      const isLast = i === chainUsers.length - 2;

      const forwardData = transactionForwardFactory(
        tx.id,
        sender.id,
        receiver.id,
        { isLast, isFulfilled: tx.fulfilled },
      );

      await prisma.transactionForward.create({ data: forwardData });
    }
  }

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
