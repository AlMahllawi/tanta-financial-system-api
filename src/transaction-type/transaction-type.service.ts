import { Injectable } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';

const transactionType = new TransactionType();
transactionType.name = 'Financial';
transactionType.creatorName = 'AlMahllawi';

@Injectable()
export class TransactionTypeService {
  create(createTransactionTypeDto: CreateTransactionTypeDto) {
    transactionType.name = createTransactionTypeDto.name;
    return transactionType;
  }

  findAll() {
    // TODO: optional creator query
    return [transactionType];
  }

  remove(name: string) {
    // TODO: reject if there exists a transaction with such type
    transactionType.name = name;
    return transactionType;
  }
}
