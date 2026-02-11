import { TransactionTypeModel } from '../../../prisma/generated/models.js';

export class TransactionType implements TransactionTypeModel {
  name: string;
  creatorName: string;
}
