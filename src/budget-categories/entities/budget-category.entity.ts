import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { UserRole } from '../../../prisma/generated/enums.js';
import {
  BudgetCategoryModel,
  BudgetEntryModel,
} from '../../../prisma/generated/models.js';

export class BudgetEntry implements BudgetEntryModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  inputterId: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  budgetName: string;

  @ApiProperty()
  createdAt: Date;
}

export class BudgetCategory implements BudgetCategoryModel {
  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The absolute total amount assigned to this budget',
  })
  @Expose()
  budget: number;

  @ApiProperty({
    description:
      'The sum of all fulfilled transactions that are tied to this budget',
  })
  @Expose()
  allocated: number;

  @ApiProperty({ description: 'budget - allocated' })
  @Expose()
  available: number;

  @ApiProperty()
  @Expose({ groups: [UserRole.ADMIN] })
  preallocation: number;
}
