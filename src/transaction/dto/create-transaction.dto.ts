import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionPriority } from 'prisma/generated/enums';

export class CreateTransactionDto {
  title: string;
  description: string;
  typeName: string;
  @ApiProperty({ enum: TransactionPriority })
  @IsOptional()
  @IsEnum(TransactionPriority)
  priority: TransactionPriority = TransactionPriority.LOW;
  documentsURIs: string[]; // TODO: repalce with IDs
}
