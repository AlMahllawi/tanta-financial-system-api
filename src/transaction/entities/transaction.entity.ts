import { ApiProperty } from '@nestjs/swagger';
import { TransactionPriority } from '../../../prisma/generated/enums.js';
import { TransactionModel } from '../../../prisma/generated/models.js';
import { Document } from '../../document/entities/document.entity.js';

export class Transaction implements TransactionModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  fulfilled: boolean;

  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => [Document] })
  documents: Document[];
}
