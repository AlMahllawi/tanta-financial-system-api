import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTransactionForwardSenderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
