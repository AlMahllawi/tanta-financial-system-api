import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { Prisma } from '../../prisma/generated/client.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionTypeQueryDto } from './dto/transaction-type-query.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';

@Injectable()
export class TransactionTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    creatorId: number,
    createTransactionTypeDto: CreateTransactionTypeDto,
  ) {
    const transactionType = await this.prisma.transactionType.create({
      data: {
        name: createTransactionTypeDto.name,
        creatorId,
      },
    });

    return plainToInstance(TransactionType, transactionType);
  }

  async findAll(queryDto: TransactionTypeQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.TransactionTypeWhereInput = {};
    if (queryDto.creatorId) where.creatorId = queryDto.creatorId;

    const [transactionTypes, total] = await this.prisma.$transaction([
      this.prisma.transactionType.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.transactionType.count({ where }),
    ]);

    return createPaginatedResult(
      plainToInstance(TransactionType, transactionTypes),
      total,
      page,
      perPage,
    );
  }

  async findOne(name: string) {
    const transactionType = await this.prisma.transactionType.findUniqueOrThrow(
      {
        where: { name },
      },
    );

    return plainToInstance(TransactionType, transactionType);
  }

  async remove(name: string, userId: number, role: UserRole) {
    let transactionType: TransactionType;
    if (role !== UserRole.ADMIN) {
      transactionType = await this.prisma.transactionType.findUniqueOrThrow({
        where: { name },
      });

      if (transactionType.creatorId !== userId)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_TRANSACTION_TYPE_CREATOR,
        );
    }

    transactionType = await this.prisma.transactionType.delete({
      where: { name },
    });

    return plainToInstance(TransactionType, transactionType);
  }
}
