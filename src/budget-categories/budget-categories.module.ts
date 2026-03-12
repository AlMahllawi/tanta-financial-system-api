import { Module } from '@nestjs/common';
import { BudgetCategoriesService } from './budget-categories.service.js';
import { BudgetCategoriesController } from './budget-categories.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetCategoriesController],
  providers: [BudgetCategoriesService],
})
export class BudgetCategoriesModule {}
