import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionPriority } from 'prisma/generated/enums';
import { DocumentService } from '../document/document.service';
import { instanceToInstance } from 'class-transformer';

const dummyTransaction = new Transaction();
dummyTransaction.title = 'Declarative Heading';
dummyTransaction.description = 'Descriptive sentence.';
dummyTransaction.typeName = 'Financial';
dummyTransaction.creatorName = 'AlMahllawi';
dummyTransaction.createdAt = new Date();
dummyTransaction.fulfilled = false;
dummyTransaction.priority = TransactionPriority.MEDIUM;
dummyTransaction.documents = [];

@Injectable()
export class TransactionService {
  constructor(private readonly documentService: DocumentService) {}

  create(createTransactionDto: CreateTransactionDto) {
    dummyTransaction.id = 1;
    dummyTransaction.title = createTransactionDto.title;
    dummyTransaction.description = createTransactionDto.description;
    dummyTransaction.typeName = createTransactionDto.typeName;
    dummyTransaction.priority =
      createTransactionDto.priority || TransactionPriority.LOW;
    dummyTransaction.createdAt = new Date();
    dummyTransaction.documents = this.documentService.findAll();
    return dummyTransaction;
  }

  findAll() {
    // TODO: query parameters
    return [dummyTransaction];
  }

  findOne(id: number) {
    const transaction = instanceToInstance(dummyTransaction);
    transaction.id = id;
    return transaction;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    dummyTransaction.id = id;
    if (updateTransactionDto.title)
      dummyTransaction.title = updateTransactionDto.title;
    if (updateTransactionDto.description)
      dummyTransaction.description = updateTransactionDto.description;
    if (updateTransactionDto.typeName)
      dummyTransaction.typeName = updateTransactionDto.typeName;
    if (updateTransactionDto.priority)
      dummyTransaction.priority = updateTransactionDto.priority;
    if (updateTransactionDto.fulfilled)
      dummyTransaction.fulfilled = updateTransactionDto.fulfilled;
    return dummyTransaction;
  }

  remove(id: number) {
    dummyTransaction.id = id;
    return dummyTransaction;
  }

  attachDocument(transactionId: number, documentId: number) {
    dummyTransaction.id = transactionId;
    dummyTransaction.documents.push(this.documentService.findOne(documentId));
    return dummyTransaction;
  }

  detachDocument(transactionId: number, documentId: number) {
    dummyTransaction.id = transactionId;
    dummyTransaction.documents = dummyTransaction.documents.filter(
      (document) => document.id !== documentId,
    );
    return dummyTransaction;
  }
}
