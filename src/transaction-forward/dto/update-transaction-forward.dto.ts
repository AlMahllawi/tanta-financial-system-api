import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, NotEquals, IsOptional } from 'class-validator';
import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { WAITING: _ignored, ...TransactionForwardStatusUpdate } =
  TransactionForwardStatus;

export class UpdateTransactionForwardDto {
  @ApiProperty({ enum: TransactionForwardStatusUpdate })
  @IsEnum(TransactionForwardStatus)
  @NotEquals(TransactionForwardStatus.WAITING)
  @IsOptional()
  status?: TransactionForwardStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
