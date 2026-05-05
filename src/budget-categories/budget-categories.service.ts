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
import { BudgetCategoryQueryDto } from './dto/budget-category-query.dto.js';
import { BudgetEntryQueryDto } from './dto/budget-entry-query.dto.js';
import { CreateBudgetEntryDto } from './dto/create-budget-entry.dto.js';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto.js';
import {
  BudgetCategory,
  BudgetEntry,
} from './entities/budget-category.entity.js';

@Injectable()
export class BudgetCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string) {
    const category = await this.prisma.budgetCategory.create({
      data: { name },
    });
    return plainToInstance(
      BudgetCategory,
      {
        ...category,
        budget: 0,
        allocated: 0,
        available: 0,
      },
      { groups: [UserRole.ADMIN] },
    );
  }

  async findAll(queryDto: BudgetCategoryQueryDto, userRole?: UserRole) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.BudgetCategoryWhereInput = {};
    if (queryDto.name)
      where.name = { contains: queryDto.name, mode: 'insensitive' };

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.budgetCategory.findMany({
        where,
        skip,
        take,
        include: { details: true },
      }),
      this.prisma.budgetCategory.count({ where }),
    ]);

    const data = categories.map((category) => {
      const { budget, allocated, available } = category.details || {
        budget: 0,
        allocated: 0,
        available: 0,
      };
      return plainToInstance(
        BudgetCategory,
        {
          name: category.name,
          preallocation: category.preallocation,
          budget,
          allocated,
          available,
        },
        { groups: userRole ? [userRole] : [] },
      );
    });

    return createPaginatedResult(data, total, page, perPage);
  }

  async findOne(name: string, userRole?: UserRole) {
    const category = await this.prisma.budgetCategory.findUniqueOrThrow({
      where: { name },
      include: { details: true },
    });
    return this.formatCategory(category, userRole);
  }

  async update(name: string, dto: UpdateBudgetCategoryDto) {
    const category = await this.prisma.budgetCategory.update({
      where: { name },
      data: {
        name: dto.newName,
        preallocation: dto.preallocation,
      },
      include: { details: true },
    });
    return this.formatCategory(category, UserRole.ADMIN);
  }

  async remove(name: string, userRole?: UserRole) {
    const category = await this.prisma.budgetCategory.delete({
      where: { name },
      include: { details: true },
    });
    return this.formatCategory(category, userRole);
  }

  async addEntry(name: string, dto: CreateBudgetEntryDto, userId: number) {
    const entry = await this.prisma.budgetEntry.create({
      data: {
        budgetName: name,
        amount: dto.amount,
        inputterId: userId,
      },
    });
    return plainToInstance(BudgetEntry, entry);
  }

  async removeEntry(name: string, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const lastEntry = await tx.budgetEntry.findFirst({
        where: { budgetName: name },
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      if (!lastEntry || lastEntry.id !== id)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_LATEST_BUDGET_ENTRY,
          { entryId: String(id) },
        );

      const deletedEntry = await tx.budgetEntry.delete({
        where: { id },
      });

      return plainToInstance(BudgetEntry, deletedEntry);
    });
  }

  private formatCategory(
    category: {
      name: string;
      preallocation: number;
      details?: { budget: number; allocated: number; available: number } | null;
    },
    userRole?: UserRole,
  ) {
    const { budget, allocated, available } = category.details || {
      budget: 0,
      allocated: 0,
      available: 0,
    };

    return plainToInstance(
      BudgetCategory,
      {
        name: category.name,
        preallocation: category.preallocation,
        budget,
        allocated,
        available,
      },
      { groups: userRole ? [userRole] : [] },
    );
  }

  async findAllEntries(budgetName: string, queryDto: BudgetEntryQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.BudgetEntryWhereInput = { budgetName };

    if (queryDto.inputter)
      where.inputter = {
        name: { contains: queryDto.inputter, mode: 'insensitive' },
      };

    if (queryDto.minAmount !== undefined || queryDto.maxAmount !== undefined) {
      where.amount = {};
      if (queryDto.minAmount !== undefined)
        where.amount.gte = queryDto.minAmount;
      if (queryDto.maxAmount !== undefined)
        where.amount.lte = queryDto.maxAmount;
    }

    if (queryDto.from || queryDto.to) {
      where.createdAt = {};
      if (queryDto.from) where.createdAt.gte = queryDto.from;
      if (queryDto.to) where.createdAt.lte = queryDto.to;
    }

    const [, entries, total] = await this.prisma.$transaction([
      this.prisma.budgetCategory.findUniqueOrThrow({
        where: { name: budgetName },
      }),
      this.prisma.budgetEntry.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.budgetEntry.count({ where }),
    ]);

    return createPaginatedResult(
      plainToInstance(BudgetEntry, entries),
      total,
      page,
      perPage,
    );
  }
}
