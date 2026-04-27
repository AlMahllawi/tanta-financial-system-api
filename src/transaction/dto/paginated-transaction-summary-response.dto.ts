import { ApiProperty } from '@nestjs/swagger';

import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';
import { PaginatedDto } from '../../common/dto/pagination.dto.js';
import { TransactionSummary } from '../entities/transaction-summary.entity.js';

export class PaginatedTransactionSummaryResponseDto extends PaginatedDto<TransactionSummary> {
  @ApiProperty({ type: [TransactionSummary] })
  declare data: TransactionSummary[];

  @ApiProperty()
  summary: Record<TransactionForwardStatus, number>;
}
