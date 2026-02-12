import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponses({
    status: HttpStatus.CREATED,
    type: Transaction,
    description: 'Transaction created successfully',
  })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
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
  @ApiResponses({
    status: HttpStatus.OK,
    type: Transaction,
    description: 'Transaction retrieved successfully',
  })
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Transaction,
    description: 'Transaction updated successfully',
  })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction by ID' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Transaction,
    description: 'Transaction deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }

  @Post(':id/document/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach a document to a transaction' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Transaction,
    description: 'Document attached to transaction successfully',
  })
  attachDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.transactionService.attachDocument(+id, +documentId);
  }

  @Delete(':id/document/:documentId')
  @ApiOperation({ summary: 'Detach a document from a transaction' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Transaction,
    description: 'Document detached from transaction successfully',
  })
  detachDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.transactionService.detachDocument(+id, +documentId);
  }
}
