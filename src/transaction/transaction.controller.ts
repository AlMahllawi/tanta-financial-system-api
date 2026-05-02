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
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
      argExtractor: (_params, body) => ({ typeName: body.typeName }),
      matchers: matchForeignConstraint('fk_transaction_type'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'One or more documents not found',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: '1, 2' },
      argExtractor: (_params, body) => ({
        id: (body.documentsIds as number[])?.join(', '),
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
  @ApiOkResponse({ type: PaginatedTransactionSummaryResponseDto })
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
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction was found with such id',
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    args: { id: 1 },
    argExtractor: (params) => ({ id: params.id }),
    matchers: matchRecordsNotFound('Transaction'),
  })
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not a participant in the transaction',
    errorCode: ErrorCode.NOT_TRANSACTION_PARTICIPANT,
    args: { transactionId: 1 },
  })
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
        { transactionId: id },
      );

    void this.transactionService.markAsSeen(id, userId);

    return this.transactionService.findOne(id, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction updated successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchRecordsNotFound('Transaction'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction type not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      args: { typeName: 'Unknown Type' },
      argExtractor: (_params, body) => ({ typeName: body.typeName }),
      matchers: matchForeignConstraint('fk_transaction_type'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Budget category not found',
      errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
      args: { budgetName: 'Unknown Budget' },
      argExtractor: (_params, body) => ({ budgetName: body.budgetName }),
      matchers: matchForeignConstraint('fk_transaction_budget'),
    },
  )
  @ApiErrorResponses(
    {
      status: HttpStatus.FORBIDDEN,
      description:
        'Only admin and accountant can update the fulfilled and budget status',
      errorCode: ErrorCode.RESTRICTED_FIELD_UPDATE,
      args: { fields: 'fulfilled, budgetName, budgetAllocation' },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction is already fulfilled and cannot be mutated',
      errorCode: ErrorCode.TRANSACTION_ALREADY_FULFILLED,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction was not forwarded to this accountant',
      errorCode: ErrorCode.NOT_LATEST_ACCOUNTANT,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction has not been approved yet',
      errorCode: ErrorCode.TRANSACTION_NOT_APPROVED,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction allocation exceeds available budget',
      errorCode: ErrorCode.INSUFFICIENT_BUDGET,
      args: { budgetName: 'General', available: 50, requested: 100 },
    },
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
            { transactionId: id },
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
          { transactionId: id },
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
  @ApiOperation({ summary: 'Delete a transaction by ID' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Transaction deleted successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchRecordsNotFound('Transaction'),
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'Cannot delete a transaction that has forwards',
      errorCode: ErrorCode.TRANSACTION_HAS_FORWARDS,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchDriverAdapter('23001', 'fk_transaction_forward'),
    },
  )
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'Transaction is already fulfilled and cannot be mutated',
    errorCode: ErrorCode.TRANSACTION_ALREADY_FULFILLED,
    args: { transactionId: 1 },
  })
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
        { transactionId: id },
      );

    return this.transactionService.remove(id, role);
  }

  @Post(':id/document/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach a document to a transaction' })
  @ApiOkResponse({
    type: Transaction,
    description: 'Document attached to transaction successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction was found with such id',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchForeignConstraint('fk_transaction_document'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No document was found with such id',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.documentId }),
      matchers: matchForeignConstraint('fk_document_transaction'),
    },
  )
  @ApiErrorResponses(
    {
      status: HttpStatus.FORBIDDEN,
      description:
        'Cannot edit documents if receiver has already seen the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_SEEN,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description:
        'Cannot edit documents if you have already responded to the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_RESPONDED,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'User is not a participant in the transaction',
      errorCode: ErrorCode.NOT_TRANSACTION_PARTICIPANT,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction is already fulfilled and cannot be mutated',
      errorCode: ErrorCode.TRANSACTION_ALREADY_FULFILLED,
      args: { transactionId: 1 },
    },
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
    description: 'Document detached from transaction successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction was found with such id',
    errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
    args: { id: 1 },
    argExtractor: (params) => ({ id: params.id }),
    matchers: matchRecordsNotFound('Transaction'),
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.FORBIDDEN,
      description:
        'Cannot edit documents if receiver has already seen the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_SEEN,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description:
        'Cannot edit documents if you have already responded to the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_RESPONDED,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'User is not a participant in the transaction',
      errorCode: ErrorCode.NOT_TRANSACTION_PARTICIPANT,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Only the user who attached the document can detach it',
      errorCode: ErrorCode.NOT_DOCUMENT_ATTACHER,
      args: { transactionId: 1, documentId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Transaction is already fulfilled and cannot be mutated',
      errorCode: ErrorCode.TRANSACTION_ALREADY_FULFILLED,
      args: { transactionId: 1 },
    },
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
          { transactionId: id, documentId },
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
          { transactionId },
        );
    } else if (latestForward.receiverId === userId) {
      if (latestForward.status !== TransactionForwardStatus.WAITING)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORWARD_ALREADY_RESPONDED,
          { transactionId },
        );
    } else
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_PARTICIPANT,
        { transactionId },
      );
  }
}
