import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTransactionForwardDto {
  @ApiProperty()
  @IsString()
  receiverName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
