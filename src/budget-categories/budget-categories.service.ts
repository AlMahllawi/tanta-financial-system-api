import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto.js';
import { CreateBudgetEntryDto } from './dto/create-budget-entry.dto.js';
import {
  BudgetCategory,
  BudgetEntry,
} from './entities/budget-category.entity.js';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class BudgetCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string) {
    const category = await this.prisma.budgetCategory.create({
      data: { name },
    });
    return plainToInstance(BudgetCategory, {
      ...category,
      budget: 0,
      allocated: 0,
      available: 0,
    });
  }

  async findAll() {
    const categories = await this.prisma.budgetCategory.findMany({
      include: { details: true },
    });
    return categories.map((category) => {
      const { budget, allocated, available } = category.details || {
        budget: 0,
        allocated: 0,
        available: 0,
      };
      return plainToInstance(BudgetCategory, {
        name: category.name,
        budget,
        allocated,
        available,
      });
    });
  }

  async findOne(name: string) {
    const category = await this.prisma.budgetCategory.findUniqueOrThrow({
      where: { name },
      include: { details: true },
    });
    return this.formatCategory(category);
  }

  async update(name: string, dto: UpdateBudgetCategoryDto) {
    const category = await this.prisma.budgetCategory.update({
      where: { name },
      data: { name: dto.newName },
      include: { details: true },
    });
    return this.formatCategory(category);
  }

  async remove(name: string) {
    const category = await this.prisma.budgetCategory.delete({
      where: { name },
      include: { details: true },
    });
    return this.formatCategory(category);
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
    const entry = await this.prisma.budgetEntry.delete({
      where: { budgetName: name, id },
    });
    return plainToInstance(BudgetEntry, entry);
  }

  private formatCategory(category: {
    name: string;
    details?: { budget: number; allocated: number; available: number } | null;
  }) {
    const { budget, allocated, available } = category.details || {
      budget: 0,
      allocated: 0,
      available: 0,
    };

    return plainToInstance(BudgetCategory, {
      name: category.name,
      budget,
      allocated,
      available,
    });
  }

  async findAllEntries(
    budgetName: string,
    { page = 1, perPage = 10 }: PaginationDto,
  ) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    const [, data, total] = await this.prisma.$transaction([
      this.prisma.budgetCategory.findUniqueOrThrow({
        where: { name: budgetName },
      }),
      this.prisma.budgetEntry.findMany({
        where: { budgetName },
        skip,
        take,
      }),
      this.prisma.budgetEntry.count({
        where: { budgetName },
      }),
    ]);

    const lastPage = Math.ceil(total / perPage);

    return {
      data,
      pagination: {
        total,
        lastPage,
        currentPage: page,
        perPage,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
      },
    };
  }
}
