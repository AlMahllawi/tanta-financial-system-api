import { ApiProperty } from '@nestjs/swagger';
import { PaginatedDto } from '../../common/dto/pagination.dto.js';
import { TransactionSummary } from '../entities/transaction-summary.entity.js';
import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';

export class PaginatedTransactionSummaryResponseDto extends PaginatedDto<TransactionSummary> {
  @ApiProperty({ type: [TransactionSummary] })
  declare data: TransactionSummary[];

  @ApiProperty()
  summary: Record<TransactionForwardStatus, number>;
}
