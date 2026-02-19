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
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter.js';
import { PrismaError } from 'prisma-error-enum';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { ApiQuery } from '@nestjs/swagger';
import { UserRole } from '../../prisma/generated/enums.js';
import { STATUS_CODES } from 'node:http';
import { User } from '../user/entities/user.entity.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiOperation({ summary: 'Get transactions' })
  @ApiQuery({
    name: 'query',
    enum: TransactionQuery,
    required: false,
    description:
      'Filter transactions by their status relative to the user.\n\n' +
      '* `inbox`: Transactions currently held by the user (user is the latest receiver).\n' +
      '* `outgoing`: Transactions passed on by the user (user is the latest sender).\n' +
      '* `all`: Every transaction in the system (Admin only).\n\n' +
      "If absent, returns 'archive' transactions (history of involvement).",
  })
  @ApiOkResponse({
    type: [Transaction],
    description: 'Transactions retrieved successfully',
  })
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have the required role to access all transactions',
    errorCode: ErrorCode.MISSING_ROLE,
    args: { roles: UserRole.ADMIN },
  })
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Query('query') query?: TransactionQuery,
  ) {
    if (query === TransactionQuery.ALL && role !== UserRole.ADMIN)
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: {
          key: ErrorCode.MISSING_ROLE,
          args: { roles: UserRole.ADMIN },
        },
        error: STATUS_CODES[HttpStatus.FORBIDDEN],
      });

    return this.transactionService.findAll(userId, query);
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
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    if (
      user.role !== UserRole.ADMIN &&
      !(await this.transactionService.isCreator(id, user.id))
    )
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: {
          key: ErrorCode.NOT_TRANSACTION_CREATOR,
          args: { transactionId: id },
        },
        error: STATUS_CODES[HttpStatus.FORBIDDEN],
      });

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
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (
      user.role !== UserRole.ADMIN &&
      !(await this.transactionService.isCreator(id, user.id))
    )
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: {
          key: ErrorCode.NOT_TRANSACTION_CREATOR,
          args: { transactionId: id },
        },
        error: STATUS_CODES[HttpStatus.FORBIDDEN],
      });

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
  async attachDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    if (
      user.role !== UserRole.ADMIN &&
      !(await this.transactionService.isParticipant(id, user.id))
    )
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: {
          key: ErrorCode.NOT_TRANSACTION_PARTICIPANT,
          args: { transactionId: id },
        },
        error: STATUS_CODES[HttpStatus.FORBIDDEN],
      });

    return this.transactionService.attachDocument(id, documentId, user.id);
  }

  @Delete(':id/document/:documentId')
  @ApiOperation({ summary: 'Detach a document from a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document detached from transaction successfully',
  })
  async detachDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    if (user.role !== UserRole.ADMIN) {
      if (!(await this.transactionService.isParticipant(id, user.id)))
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          message: {
            key: ErrorCode.NOT_TRANSACTION_PARTICIPANT,
            args: { transactionId: id },
          },
          error: STATUS_CODES[HttpStatus.FORBIDDEN],
        });

      if (!(await this.transactionService.isAttacher(id, documentId, user.id)))
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          message: {
            key: ErrorCode.NOT_DOCUMENT_ATTACHER,
            args: { transactionId: id, documentId },
          },
          error: STATUS_CODES[HttpStatus.FORBIDDEN],
        });
    }

    return this.transactionService.detachDocument(id, documentId);
  }
}
