import { Injectable } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { UpdateTransactionForwardSenderDto } from './dto/update-transaction-forward-sender.dto.js';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { TransactionForwardStatus } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { ApiException } from '../common/exceptions/api.exception.js';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class TransactionForwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    senderId: number,
    transactionId: number,
    createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    await this.validateForwardCreation(senderId, transactionId);

    const forward = await this.prisma.transactionForward.create({
      data: {
        transactionId,
        senderId,
        receiverId: createTransactionForwardDto.receiverId,
        senderComment: createTransactionForwardDto.comment ?? null,
        status: TransactionForwardStatus.WAITING,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forward);
  }

  // TODO: paginate
  async findAll(transactionId: number) {
    const forwards = await this.prisma.transactionForward.findMany({
      where: { transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forwards);
  }

  async findOne(transactionId: number, id: number) {
    const forward = await this.prisma.transactionForward.findFirstOrThrow({
      where: { id, transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forward);
  }

  async markAsSeen(forwardId: number, userId: number) {
    const forward = await this.prisma.transactionForward.findUnique({
      where: { id: forwardId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        senderSeen: true,
        receiverSeen: true,
      },
    });

    if (!forward) return;

    if (forward.senderId === userId && forward.senderSeen === false) {
      await this.prisma.transactionForward.update({
        where: { id: forward.id },
        data: { senderSeen: true },
      });
    } else if (
      forward.receiverId === userId &&
      forward.receiverSeen === false
    ) {
      await this.prisma.transactionForward.update({
        where: { id: forward.id },
        data: { receiverSeen: true },
      });
    }
  }

  async updateResponse(
    transactionId: number,
    id: number,
    updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    // TODO: deny if sender seen
    const forward = await this.prisma.transactionForward.update({
      where: { id, transactionId },
      data: {
        status: updateTransactionForwardDto.status,
        receiverComment: updateTransactionForwardDto.comment ?? null,
        receiverSeen: true,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forward);
  }

  async updateSender(
    transactionId: number,
    id: number,
    updateTransactionForwardSenderDto: UpdateTransactionForwardSenderDto,
  ) {
    // TODO: deny if receiver responded
    const forward = await this.prisma.transactionForward.update({
      where: { id, transactionId },
      data: {
        senderComment: updateTransactionForwardSenderDto.comment ?? null,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forward);
  }

  async remove(transactionId: number, id: number) {
    const forward = await this.prisma.transactionForward.delete({
      where: { id, transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, forward);
  }

  private async validateForwardCreation(userId: number, transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        creatorId: true,
        latestForward: true,
      },
    });

    if (!transaction) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        { transactionId },
      );
    }

    const { latestForward } = transaction;

    if (!latestForward) {
      if (userId !== transaction.creatorId)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_TRANSACTION_CREATOR,
          { transactionId },
        );
    } else {
      if (userId !== latestForward.receiverId)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_LATEST_RECEIVER,
          { transactionId },
        );

      if (latestForward.status === TransactionForwardStatus.WAITING)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORWARD_NOT_RESPONDED,
          { transactionId },
        );
    }
  }
}
