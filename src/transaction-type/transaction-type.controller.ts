import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionType } from './entities/transaction-type.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Transaction Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
