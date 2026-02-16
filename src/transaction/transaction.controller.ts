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
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiErrorResponses } from '../common/decorators/error.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter.js';
import { PrismaError } from 'prisma-error-enum';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiCreatedResponse({
    type: Transaction,
    description: 'Transaction created successfully',
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'typeName',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction creator not found',
      errorCode: ErrorCode.TRANSACTION_CREATOR_NOT_FOUND,
      args: { creatorId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'creatorId',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'One or more documents not found',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: '1, 2' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'TransactionDocument',
      },
    },
  )
  create(
    @CurrentUser('id') creatorId: number,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(creatorId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiOkResponse({
    type: [Transaction],
    description: 'Transactions retrieved successfully',
  })
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction retrieved successfully',
  })
  @ApiErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction was found with such id',
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    args: { id: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction updated successfully',
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
      prisma: { error: PrismaError.RecordsNotFound },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'typeName',
      },
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
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction deleted successfully',
  })
  @ApiErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction was found with such id',
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    args: { id: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }

  @Post(':id/document/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach a document to a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document attached to transaction successfully',
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'transactionId',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No document was found with such id',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'documentId',
      },
    },
  )
  attachDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.transactionService.attachDocument(id, documentId, userId);
  }

  @Delete(':id/document/:documentId')
  @ApiOperation({ summary: 'Detach a document from a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document detached from transaction successfully',
  })
  detachDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    // TODO: deny if not attacher
    return this.transactionService.detachDocument(id, documentId);
  }
}
