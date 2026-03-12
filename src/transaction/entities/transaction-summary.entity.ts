import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  TransactionPriority,
  TransactionForwardStatus,
  UserRole,
} from '../../../prisma/generated/enums.js';

export class TransactionSummary {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  fulfilled: boolean;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Only visible to admin and accountant.',
  })
  @Expose({ groups: [UserRole.ADMIN, UserRole.ACCOUNTANT] })
  budgetName: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Only visible to admin and accountant.',
  })
  @Expose({ groups: [UserRole.ADMIN, UserRole.ACCOUNTANT] })
  budgetAllocation: number | null;

  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;

  @ApiProperty({ enum: TransactionForwardStatus, required: false })
  lastForwardStatus?: TransactionForwardStatus;

  @ApiProperty()
  documentsCount: number;
}
