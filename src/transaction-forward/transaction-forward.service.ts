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
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

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

  async findAll(transactionId: number, paginationDto: PaginationDto) {
    const { skip, take, page, perPage } = createPaginator(paginationDto);

    const [forwards, total] = await this.prisma.$transaction([
      this.prisma.transactionForward.findMany({
        where: { transactionId },
        include: {
          sender: true,
          receiver: true,
        },
        skip,
        take,
      }),
      this.prisma.transactionForward.count({
        where: { transactionId },
      }),
    ]);

    return createPaginatedResult(
      plainToInstance(TransactionForward, forwards),
      total,
      page,
      perPage,
    );
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
    await Promise.all([
      this.prisma.transactionForward.updateMany({
        where: { id: forwardId, senderId: userId },
        data: { senderSeen: true },
      }),
      this.prisma.transactionForward.updateMany({
        where: { id: forwardId, receiverId: userId },
        data: { receiverSeen: true },
      }),
    ]);
  }

  async updateResponse(
    userId: number,
    transactionId: number,
    id: number,
    updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    const forward = await this.prisma.transactionForward.findUnique({
      where: { id, transactionId },
      include: {
        transaction: {
          select: {
            latestForward: true,
            fulfilled: true,
          },
        },
      },
    });

    if (!forward)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { id, transactionId },
      );

    if (forward.transaction.fulfilled)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId },
      );

    if (forward.receiverId !== userId)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_RECEIVER,
        { id },
      );

    if (forward.senderSeen && forward.receiverComment !== null)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_SEEN,
        { id },
      );

    if (forward.transaction.latestForward?.id !== id)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_RESPONDED,
        { id },
      );

    const updatedForward = await this.prisma.transactionForward.update({
      where: { id, transactionId },
      data: {
        status: updateTransactionForwardDto.status,
        receiverComment: updateTransactionForwardDto.comment ?? null,
        receiverSeen: true,
        senderSeen: false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, updatedForward);
  }

  async updateSender(
    userId: number,
    transactionId: number,
    id: number,
    updateTransactionForwardSenderDto: UpdateTransactionForwardSenderDto,
  ) {
    const forward = await this.prisma.transactionForward.findUnique({
      where: { id, transactionId },
      include: {
        transaction: {
          select: { fulfilled: true },
        },
      },
    });

    if (!forward)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { id, transactionId },
      );

    if (forward.transaction.fulfilled)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId },
      );

    if (forward.senderId !== userId)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_SENDER,
        { id },
      );

    if (forward.status !== TransactionForwardStatus.WAITING)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_RESPONDED,
        { id },
      );

    const updatedForward = await this.prisma.transactionForward.update({
      where: { id, transactionId },
      data: {
        senderComment: updateTransactionForwardSenderDto.comment ?? null,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, updatedForward);
  }

  async remove(userId: number, transactionId: number, id: number) {
    const forward = await this.prisma.transactionForward.findUnique({
      where: { id, transactionId },
      include: {
        transaction: {
          select: { fulfilled: true },
        },
      },
    });

    if (!forward)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { id, transactionId },
      );

    if (forward.transaction.fulfilled)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId },
      );

    if (forward.senderId !== userId)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_SENDER,
        { id },
      );

    if (forward.receiverSeen)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_SEEN,
        { id },
      );

    const removedForward = await this.prisma.transactionForward.delete({
      where: { id, transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return plainToInstance(TransactionForward, removedForward);
  }

  private async validateForwardCreation(userId: number, transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        creatorId: true,
        latestForward: true,
        fulfilled: true,
      },
    });

    if (!transaction)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        { transactionId },
      );

    if (transaction.fulfilled)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId },
      );

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
