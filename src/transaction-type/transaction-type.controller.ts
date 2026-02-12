import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionType } from './entities/transaction-type.entity.js';
import { ApiResponses } from '../common/decorators/http.js';
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
  @ApiResponses({
    status: HttpStatus.CREATED,
    type: TransactionType,
    description: 'Transaction type created successfully',
  })
  create(@Body() createTransactionTypeDto: CreateTransactionTypeDto) {
    return this.transactionTypeService.create(createTransactionTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transaction types' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [TransactionType],
    description: 'Transaction types retrieved successfully',
  })
  findAll() {
    return this.transactionTypeService.findAll();
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: TransactionType,
    description: 'Transaction type deleted successfully',
  })
  remove(@Param('name') name: string) {
    return this.transactionTypeService.remove(name);
  }
}
