import { Injectable } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto';
import { TransactionForward } from './entities/transaction-forward.entity';
import { TransactionForwardStatus } from 'prisma/generated/enums';

const transactionForward = new TransactionForward();
transactionForward.receiverName = 'Yusuf';
transactionForward.senderName = 'AlMahllawi';
transactionForward.status = TransactionForwardStatus.WAITING;
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
    transactionForward.receiverName = createTransactionForwardDto.receiverName;
    transactionForward.senderComment =
      createTransactionForwardDto.comment ?? null;
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
    transactionForward.receiverComment =
      updateTransactionForwardDto.comment ?? null;
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
