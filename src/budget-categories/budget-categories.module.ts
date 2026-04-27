import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { BudgetCategoriesController } from './budget-categories.controller.js';
import { BudgetCategoriesService } from './budget-categories.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetCategoriesController],
  providers: [BudgetCategoriesService],
})
export class BudgetCategoriesModule {}
