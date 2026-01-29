import { Injectable } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto';

@Injectable()
export class TransactionForwardService {
  create(
    transactionId: number,
    createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    return `This action adds a new transaction forward to transaction #${transactionId}`;
  }

  findAll(transactionId: number) {
    return `This action returns all transaction #${transactionId}'s forwards`;
  }

  update(
    transactionId: number,
    id: number,
    updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    return `This action updates the transaction #${transactionId}'s forward #${id}`;
  }

  remove(transactionId: number, id: number) {
    return `This action removes the transaction #${transactionId}'s forward #${id}`;
  }
}
