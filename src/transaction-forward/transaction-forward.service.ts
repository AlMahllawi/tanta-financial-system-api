import { Injectable } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { TransactionForwardStatus } from '../../prisma/generated/enums.js';
import { UserService } from '../user/user.service.js';

const transactionForward = new TransactionForward();
transactionForward.status = TransactionForwardStatus.WAITING;
transactionForward.senderSeen = true;
transactionForward.receiverSeen = false;
transactionForward.forwardedAt = new Date();
transactionForward.updatedAt = new Date();
transactionForward.transactionId = 1;

@Injectable()
export class TransactionForwardService {
  constructor(private readonly userService: UserService) {}

  async create(
    transactionId: number,
    createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    transactionForward.id = 1;
    transactionForward.status = TransactionForwardStatus.WAITING;
    transactionForward.receiverId = createTransactionForwardDto.receiverId;
    transactionForward.senderComment =
      createTransactionForwardDto.comment ?? null;
    transactionForward.transactionId = transactionId;
    transactionForward.sender = await this.userService.findOne(
      createTransactionForwardDto.receiverId !== 1 ? 1 : 2,
    );
    transactionForward.receiver = await this.userService.findOne(
      createTransactionForwardDto.receiverId,
    );
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
    transactionForward.receiverSeen = true;
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
