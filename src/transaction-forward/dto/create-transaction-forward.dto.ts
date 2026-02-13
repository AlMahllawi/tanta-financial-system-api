import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTransactionForwardDto {
  @ApiProperty()
  @IsInt()
  receiverId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
