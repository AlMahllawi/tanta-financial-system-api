import { Injectable } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto';
import { TransactionForward } from './entities/transaction-forward.entity';
import { TransactionForwardStatus } from 'prisma/generated/enums';

const transactionForward = new TransactionForward();
transactionForward.receiver = 'Yusuf';
transactionForward.sender = 'AlMahllawi';
transactionForward.status = TransactionForwardStatus.WAITING;
transactionForward.comment = 'Please review';
transactionForward.seen = false;
transactionForward.forwardedAt = new Date();
transactionForward.updatedAt = new Date();
transactionForward.transactionId = 1;

@Injectable()
export class TransactionForwardService {
  create(
    transactionId: number,
    createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    transactionForward.id = 1;
    transactionForward.status = TransactionForwardStatus.WAITING;
    transactionForward.receiver = createTransactionForwardDto.receiverName;
    transactionForward.comment = null;
    transactionForward.transactionId = transactionId;
    return transactionForward;
  }

  findAll(transactionId: number) {
    transactionForward.transactionId = transactionId;
    return [transactionForward];
  }

  update(
    transactionId: number,
    id: number,
    updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    transactionForward.id = id;
    transactionForward.status = updateTransactionForwardDto.status;
    transactionForward.comment = updateTransactionForwardDto.comment;
    transactionForward.seen = true;
    transactionForward.updatedAt = new Date();
    transactionForward.transactionId = transactionId;
    return transactionForward;
  }

  remove(transactionId: number, id: number) {
    transactionForward.id = id;
    transactionForward.transactionId = transactionId;
    return transactionForward;
  }
}
