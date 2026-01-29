import { Injectable } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';

@Injectable()
export class TransactionTypeService {
  create(createTransactionTypeDto: CreateTransactionTypeDto) {
    return `This action adds a new transaction type "${createTransactionTypeDto.name}"`;
  }

  findAll() {
    // TODO: optional creator query
    return `This action returns all transaction types`;
  }

  remove(name: string) {
    // TODO: reject if there exists a transaction with such type
    return `This action removes the transaction type "${name}"`;
  }
}
