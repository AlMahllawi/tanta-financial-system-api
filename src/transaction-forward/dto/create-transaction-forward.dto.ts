import { IsOptional, IsString } from 'class-validator';

export class CreateTransactionForwardDto {
  @IsString()
  receiverName: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
