import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class TransactionTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    creatorId: number,
    createTransactionTypeDto: CreateTransactionTypeDto,
  ) {
    try {
      const transactionType = await this.prisma.transactionType.create({
        data: {
          name: createTransactionTypeDto.name,
          creatorId,
        },
      });

      return plainToInstance(TransactionType, transactionType);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2002' &&
        (error.meta?.target as string[]).includes('name')
      )
        throw new ConflictException({
          message: {
            key: ErrorCode.TRANSACTION_TYPE_ALREADY_EXISTS,
            args: { name: createTransactionTypeDto.name },
          },
          statusCode: 409,
          error: 'Conflict',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('creatorId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_TYPE_CREATOR_NOT_FOUND,
            args: { creatorId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  // TODO: paginate, creator query
  async findAll() {
    const transactionTypes = await this.prisma.transactionType.findMany();

    return plainToInstance(TransactionType, transactionTypes);
  }

  async findOne(name: string) {
    const transactionType = await this.prisma.transactionType.findUnique({
      where: { name },
    });

    if (!transactionType)
      throw new NotFoundException({
        message: { key: ErrorCode.TRANSACTION_TYPE_NOT_FOUND, args: { name } },
        statusCode: 404,
        error: 'Not Found',
      });

    return plainToInstance(TransactionType, transactionType);
  }

  async remove(name: string) {
    try {
      const transactionType = await this.prisma.transactionType.delete({
        where: { name },
      });

      return plainToInstance(TransactionType, transactionType);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
            args: { name },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }
}
