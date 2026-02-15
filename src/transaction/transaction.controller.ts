import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponses(
    {
      status: HttpStatus.CREATED,
      type: Transaction,
      description: 'Transaction created successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction creator not found',
      errorCode: ErrorCode.TRANSACTION_CREATOR_NOT_FOUND,
      args: { creatorId: 1 },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'One or more documents not found',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: '1, 2' },
    },
  )
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser('id') creatorId: number,
  ) {
    return this.transactionService.create(creatorId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [Transaction],
    description: 'Transactions retrieved successfully',
  })
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Transaction,
      description: 'Transaction retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
    },
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Transaction,
      description: 'Transaction updated successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
    },
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction by ID' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Transaction,
      description: 'Transaction deleted successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
    },
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }
}
