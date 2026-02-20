import { Injectable } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

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

  async findAll(paginationDto: PaginationDto) {
    const { skip, take, page, perPage } = createPaginator(paginationDto);

    const [transactionTypes, total] = await this.prisma.$transaction([
      this.prisma.transactionType.findMany({
        skip,
        take,
      }),
      this.prisma.transactionType.count(),
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

  async remove(name: string) {
    const transactionType = await this.prisma.transactionType.delete({
      where: { name },
    });

    return plainToInstance(TransactionType, transactionType);
  }
}
