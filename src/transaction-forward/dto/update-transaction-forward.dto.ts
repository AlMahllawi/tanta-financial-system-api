import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransactionForwardStatus } from 'prisma/generated/enums';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { WAITING: _ignored, ...TransactionForwardStatusUpdate } =
  TransactionForwardStatus;

export class UpdateTransactionForwardDto {
  @ApiProperty({ enum: TransactionForwardStatusUpdate })
  @IsEnum(TransactionForwardStatusUpdate)
  status: typeof TransactionForwardStatusUpdate;
  comment: string;
}
