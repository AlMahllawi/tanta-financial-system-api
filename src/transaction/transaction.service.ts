import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionPriority } from 'prisma/generated/enums';

const transaction = new Transaction();
transaction.title = 'Declarative Heading';
transaction.description = 'Descriptive sentence.';
transaction.typeName = 'Financial';
transaction.creatorName = 'AlMahllawi';
transaction.createdAt = new Date();
transaction.fulfilled = false;
transaction.priority = TransactionPriority.MEDIUM;

@Injectable()
export class TransactionService {
  create(createTransactionDto: CreateTransactionDto) {
    transaction.id = 1;
    transaction.title = createTransactionDto.title;
    transaction.description = createTransactionDto.description;
    transaction.typeName = createTransactionDto.typeName;
    transaction.priority =
      createTransactionDto.priority || TransactionPriority.LOW;
    transaction.createdAt = new Date();
    return transaction;
  }

  findAll() {
    // TODO: query parameters
    return [transaction];
  }

  findOne(id: number) {
    transaction.id = id;
    return transaction;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    if (updateTransactionDto.title)
      transaction.title = updateTransactionDto.title;
    if (updateTransactionDto.description)
      transaction.description = updateTransactionDto.description;
    if (updateTransactionDto.typeName)
      transaction.typeName = updateTransactionDto.typeName;
    if (updateTransactionDto.priority)
      transaction.priority = updateTransactionDto.priority;
    if (updateTransactionDto.fulfilled)
      transaction.fulfilled = updateTransactionDto.fulfilled;
    return transaction;
  }

  remove(id: number) {
    transaction.id = id;
    return transaction;
  }

  attachDocument(transactionId: number, documentId: number) {
    transaction.id = transactionId;
    transaction.description += `\nAttached Document #${documentId}`;
    return transaction;
  }

  detachDocument(transactionId: number, documentId: number) {
    transaction.id = transactionId;
    transaction.description = transaction.description.replace(
      `\nAttached Document #${documentId}`,
      '',
    );
    return transaction;
  }
}
