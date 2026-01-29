import { TransactionTypeModel } from 'prisma/generated/models';

export class TransactionType implements TransactionTypeModel {
  name: string;
  creator: string;
}
