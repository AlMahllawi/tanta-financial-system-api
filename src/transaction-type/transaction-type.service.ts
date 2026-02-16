import { Injectable } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';

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

  // TODO: paginate, creator query
  async findAll() {
    const transactionTypes = await this.prisma.transactionType.findMany();

    return plainToInstance(TransactionType, transactionTypes);
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
