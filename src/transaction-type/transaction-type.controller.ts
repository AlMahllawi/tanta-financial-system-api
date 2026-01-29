import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Transaction Types')
@Controller('transactions-types')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction type' })
  create(@Body() createTransactionTypeDto: CreateTransactionTypeDto) {
    return this.transactionTypeService.create(createTransactionTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transaction types' })
  findAll() {
    return this.transactionTypeService.findAll();
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a transaction type' })
  remove(@Param('name') name: string) {
    return this.transactionTypeService.remove(name);
  }
}
