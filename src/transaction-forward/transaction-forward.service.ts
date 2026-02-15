import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { TransactionForwardStatus } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class TransactionForwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    senderId: number,
    transactionId: number,
    createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    try {
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
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('transactionId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_TRANSACTION_NOT_FOUND,
            args: { transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('senderId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_SENDER_NOT_FOUND,
            args: { senderId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('receiverId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_RECEIVER_NOT_FOUND,
            args: { receiverId: createTransactionForwardDto.receiverId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
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
    const forward = await this.prisma.transactionForward.findFirst({
      where: { id, transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!forward)
      throw new NotFoundException({
        message: {
          key: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
          args: { id, transactionId },
        },
        statusCode: 404,
        error: 'Not Found',
      });

    return plainToInstance(TransactionForward, forward);
  }

  async update(
    transactionId: number,
    id: number,
    updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    try {
      // Ensure the forward belongs to the transaction
      const existing = await this.prisma.transactionForward.findFirst({
        where: { id, transactionId },
      });

      if (!existing)
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
            args: { id, transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });

      const forward = await this.prisma.transactionForward.update({
        where: { id },
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
            args: { id, transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  async remove(transactionId: number, id: number) {
    try {
      // Ensure the forward belongs to the transaction
      const existing = await this.prisma.transactionForward.findFirst({
        where: { id, transactionId },
      });

      if (!existing)
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
            args: { id, transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });

      const forward = await this.prisma.transactionForward.delete({
        where: { id },
        include: {
          sender: true,
          receiver: true,
        },
      });

      return plainToInstance(TransactionForward, forward);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
            args: { id, transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }
}
