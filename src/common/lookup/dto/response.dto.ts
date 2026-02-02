import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionForwardStatus,
  TransactionPriority,
  UserGroups,
} from 'prisma/generated/enums';

export class LookupResponseDto {
  @ApiProperty({ enum: UserGroups, isArray: true })
  UserGroups: UserGroups[];

  @ApiProperty({ enum: TransactionPriority, isArray: true })
  TransactionPriority: TransactionPriority[];

  @ApiProperty({ enum: TransactionForwardStatus, isArray: true })
  TransactionForwardStatus: TransactionForwardStatus[];
}
