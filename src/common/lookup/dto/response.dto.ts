import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionForwardStatus,
  TransactionPriority,
  UserRole,
} from 'prisma/generated/enums';

export class LookupResponseDto {
  @ApiProperty({ enum: UserRole, isArray: true })
  UserRole: UserRole[];

  @ApiProperty({ enum: TransactionPriority, isArray: true })
  TransactionPriority: TransactionPriority[];

  @ApiProperty({ enum: TransactionForwardStatus, isArray: true })
  TransactionForwardStatus: TransactionForwardStatus[];
}
