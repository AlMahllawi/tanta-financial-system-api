import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  TransactionForwardStatus,
  UserRole,
} from '../../prisma/generated/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles, RolesException } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import {
  matchDriverAdapter,
  matchForeignConstraint,
  matchRecordsNotFound,
} from '../prisma/prisma.matchers.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { PaginatedTransactionSummaryResponseDto } from './dto/paginated-transaction-summary-response.dto.js';
import { TransactionQueryDto } from './dto/transaction-query.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { TransactionService } from './transaction.service.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiCreatedResponse({
    type: Transaction,
    description: 'Transaction created successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      argExtractor: (_params, body) => ({ typeName: String(body.typeName) }),
      matchers: matchForeignConstraint('fk_transaction_type'),
    },
    {
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      argExtractor: (_params, body) => ({
        documentId: (body.documentsIds as number[])?.join(', '),
      }),
      matchers: matchForeignConstraint('fk_document_transaction'),
    },
  )
  create(
    @CurrentUser('id') creatorId: number,
    @CurrentUser('role') role: UserRole,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(
      creatorId,
      role,
      createTransactionDto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @RolesException((_, request) => request.query.query !== TransactionQuery.ALL)
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
    type: PaginatedTransactionSummaryResponseDto,
    description: 'Transactions retrieved successfully',
  })
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Query() queryDto: TransactionQueryDto,
  ) {
    return this.transactionService.findAll(userId, role, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    argExtractor: (params) => ({ transactionId: String(params.id) }),
    matchers: matchRecordsNotFound('Transaction'),
  })
  @ApiErrorResponses(ErrorCode.NOT_TRANSACTION_PARTICIPANT)
  async findOne(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (
      role !== UserRole.ADMIN &&
      !(await this.transactionService.isParticipant(id, userId))
    )
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_PARTICIPANT,
        { transactionId: String(id) },
      );

    void this.transactionService.markAsSeen(id, userId);

    return this.transactionService.findOne(id, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction updated successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      argExtractor: (params) => ({ transactionId: String(params.id) }),
      matchers: matchRecordsNotFound('Transaction'),
    },
    {
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      argExtractor: (_params, body) => ({ typeName: String(body.typeName) }),
      matchers: matchForeignConstraint('fk_transaction_type'),
    },
    {
      errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
      argExtractor: (_params, body) => ({
        categoryName: String(body.budgetName),
      }),
      matchers: matchForeignConstraint('fk_transaction_budget'),
    },
  )
  @ApiErrorResponses(
    ErrorCode.RESTRICTED_FIELD_UPDATE,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
    ErrorCode.NOT_LATEST_ACCOUNTANT,
    ErrorCode.TRANSACTION_NOT_APPROVED,
    ErrorCode.INSUFFICIENT_BUDGET,
  )
  async update(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    if (role !== UserRole.ADMIN) {
      const updatingFields = Object.keys(updateTransactionDto).filter(
        (key) =>
          updateTransactionDto[key as keyof UpdateTransactionDto] !== undefined,
      );
      if (role === UserRole.ACCOUNTANT) {
        const isUpdatingNonAccountantFields = updatingFields.some(
          (field) =>
            !['fulfilled', 'budgetName', 'budgetAllocation'].includes(field),
        );
        if (isUpdatingNonAccountantFields)
          throw new ApiException(
            HttpStatus.FORBIDDEN,
            ErrorCode.NOT_TRANSACTION_CREATOR,
            { transactionId: String(id) },
          );
      } else if (await this.transactionService.isCreator(id, userId)) {
        const updatingAccountantFields = updatingFields.filter((field) =>
          ['fulfilled', 'budgetName', 'budgetAllocation'].includes(field),
        );
        if (updatingAccountantFields.length > 0)
          throw new ApiException(
            HttpStatus.FORBIDDEN,
            ErrorCode.RESTRICTED_FIELD_UPDATE,
            { fields: updatingAccountantFields.join(', ') },
          );
      } else
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_TRANSACTION_CREATOR,
          { transactionId: String(id) },
        );
    }

    if (updateTransactionDto.fulfilled)
      if (
        !updateTransactionDto.budgetName ||
        updateTransactionDto.budgetAllocation === undefined
      )
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.MISSING_BUDGET_INFO,
          { required: 'budgetName, budgetAllocation' },
        );

    return this.transactionService.update(
      id,
      userId,
      role,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({
    description: 'Transaction deleted successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      argExtractor: (params) => ({ transactionId: String(params.id) }),
      matchers: matchRecordsNotFound('Transaction'),
    },
    {
      errorCode: ErrorCode.TRANSACTION_HAS_FORWARDS,
      argExtractor: (params) => ({ transactionId: String(params.id) }),
      matchers: matchDriverAdapter('23001', 'fk_transaction_forward'),
    },
  )
  @ApiErrorResponses(ErrorCode.TRANSACTION_ALREADY_FULFILLED)
  async remove(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (
      role !== UserRole.ADMIN &&
      !(await this.transactionService.isCreator(id, userId))
    )
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_CREATOR,
        { transactionId: String(id) },
      );

    return this.transactionService.remove(id, role);
  }

  @Post(':id/document/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach a document to a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document attached successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      argExtractor: (params) => ({ transactionId: String(params.id) }),
      matchers: matchForeignConstraint('fk_transaction_document'),
    },
    {
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      argExtractor: (params) => ({ documentId: String(params.documentId) }),
      matchers: matchForeignConstraint('fk_document_transaction'),
    },
  )
  @ApiErrorResponses(
    ErrorCode.FORWARD_ALREADY_SEEN,
    ErrorCode.FORWARD_ALREADY_RESPONDED,
    ErrorCode.NOT_TRANSACTION_PARTICIPANT,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  async attachDocument(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    if (role !== UserRole.ADMIN) await this.checkRestriction(userId, id);

    return this.transactionService.attachDocument(id, documentId, userId, role);
  }

  @Delete(':id/document/:documentId')
  @ApiOperation({ summary: 'Detach a document from a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document detached successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    argExtractor: (params) => ({ transactionId: String(params.id) }),
    matchers: matchRecordsNotFound('Transaction'),
  })
  @ApiErrorResponses(
    ErrorCode.FORWARD_ALREADY_SEEN,
    ErrorCode.FORWARD_ALREADY_RESPONDED,
    ErrorCode.NOT_TRANSACTION_PARTICIPANT,
    ErrorCode.NOT_DOCUMENT_ATTACHER,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  async detachDocument(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    if (role !== UserRole.ADMIN) {
      await this.checkRestriction(userId, id);

      if (!(await this.transactionService.isAttacher(id, documentId, userId)))
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_DOCUMENT_ATTACHER,
          { transactionId: String(id), documentId: String(documentId) },
        );
    }

    return this.transactionService.detachDocument(id, documentId, role);
  }

  private async checkRestriction(userId: number, transactionId: number) {
    const latestForward =
      await this.transactionService.findLatestForward(transactionId);

    if (!latestForward) return;

    if (latestForward.senderId === userId) {
      if (latestForward.receiverSeen)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORWARD_ALREADY_SEEN,
          {
            forwardId: String(latestForward.id),
          },
        );
    } else if (latestForward.receiverId === userId) {
      if (latestForward.status !== TransactionForwardStatus.WAITING)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORWARD_ALREADY_RESPONDED,
          {
            forwardId: String(latestForward.id),
          },
        );
    } else
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_PARTICIPANT,
        { transactionId: String(transactionId) },
      );
  }
}
