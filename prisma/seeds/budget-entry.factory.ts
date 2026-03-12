import { faker } from '@faker-js/faker';

export const budgetEntryFactory = (budgetName: string, inputterId: number) => ({
  budgetName,
  inputterId,
  amount: parseFloat(faker.finance.amount({ min: 100, max: 10000, dec: 2 })),
});

export const manyBudgetEntriesFactory = (
  count: number,
  budgetName: string,
  inputterId: number,
) =>
  Array.from({ length: count }, () =>
    budgetEntryFactory(budgetName, inputterId),
  );
