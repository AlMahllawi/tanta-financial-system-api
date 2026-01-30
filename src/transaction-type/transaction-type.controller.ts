import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionType } from './entities/transaction-type.entity';

@ApiTags('Transaction Types')
@Controller('transactions/types')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction type' })
  @ApiResponse({ status: 201, type: TransactionType })
  create(@Body() createTransactionTypeDto: CreateTransactionTypeDto) {
    return this.transactionTypeService.create(createTransactionTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transaction types' })
  @ApiResponse({ status: 200, type: [TransactionType] })
  findAll() {
    return this.transactionTypeService.findAll();
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiResponse({ status: 200, type: TransactionType })
  remove(@Param('name') name: string) {
    return this.transactionTypeService.remove(name);
  }
}
