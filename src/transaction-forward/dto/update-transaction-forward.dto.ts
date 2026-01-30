import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, NotEquals } from 'class-validator';
import { TransactionForwardStatus } from 'prisma/generated/enums';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { WAITING: _ignored, ...TransactionForwardStatusUpdate } =
  TransactionForwardStatus;

export class UpdateTransactionForwardDto {
  @ApiProperty({ enum: TransactionForwardStatusUpdate })
  @IsEnum(TransactionForwardStatus)
  @NotEquals(TransactionForwardStatus.WAITING)
  status: TransactionForwardStatus;

  @IsString()
  comment: string;
}
