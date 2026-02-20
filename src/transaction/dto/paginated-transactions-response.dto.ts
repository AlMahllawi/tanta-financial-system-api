import { ApiProperty } from '@nestjs/swagger';
import { PaginatedDto } from '../../common/dto/pagination.dto.js';
import { Transaction } from '../entities/transaction.entity.js';

export class TransactionSummaryDto {
  @ApiProperty()
  WAITING: number;

  @ApiProperty()
  NEEDS_EDITING: number;

  @ApiProperty()
  REJECTED: number;

  @ApiProperty()
  APPROVED: number;
}

export class PaginatedTransactionsResponseDto extends PaginatedDto<Transaction> {
  @ApiProperty({ type: [Transaction] })
  declare data: Transaction[];

  @ApiProperty()
  summary: TransactionSummaryDto;
}
