import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import {
  matchForeignConstraint,
  matchRecordsNotFound,
} from '../prisma/prisma.matchers.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { UpdateTransactionForwardSenderDto } from './dto/update-transaction-forward-sender.dto.js';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { TransactionForwardService } from './transaction-forward.service.js';

@ApiTags('Transaction Forwards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transaction/:transactionId/forward')
export class TransactionForwardController {
  constructor(
    private readonly transactionForwardService: TransactionForwardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Forward a transaction' })
  @ApiCreatedResponse({
    type: TransactionForward,
    description: 'Transaction forwarded successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      argExtractor: (params) => ({
        transactionId: String(params.transactionId),
      }),
      matchers: matchForeignConstraint('fk_transaction_forward'),
    },
    {
      errorCode: ErrorCode.TRANSACTION_FORWARD_RECEIVER_NOT_FOUND,
      argExtractor: (_params, body) => ({
        receiverId: String(body.receiverId),
      }),
      matchers: matchForeignConstraint('fk_transaction_forward_receiver'),
    },
  )
  @ApiErrorResponses(
    ErrorCode.TRANSACTION_NOT_FOUND,
    ErrorCode.NOT_TRANSACTION_CREATOR,
    ErrorCode.NOT_LATEST_RECEIVER,
    ErrorCode.FORWARD_NOT_RESPONDED,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  create(
    @CurrentUser('id') senderId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    return this.transactionForwardService.create(
      senderId,
      transactionId,
      createTransactionForwardDto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all transaction's forwards" })
  @ApiPaginatedResponse(TransactionForward)
  findAll(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.transactionForwardService.findAll(transactionId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction forward' })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    argExtractor: (params) => ({
      forwardId: String(params.id),
      transactionId: String(params.transactionId),
    }),
    matchers: matchRecordsNotFound('TransactionForward'),
  })
  findOne(
    @CurrentUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    void this.transactionForwardService.markAsSeen(id, userId);

    return this.transactionForwardService.findOne(transactionId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update forward (sender comment)' })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward updated successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    argExtractor: (params) => ({
      forwardId: String(params.id),
      transactionId: String(params.transactionId),
    }),
    matchers: matchRecordsNotFound('TransactionForward'),
  })
  @ApiErrorResponses(
    ErrorCode.NOT_FORWARD_SENDER,
    ErrorCode.FORWARD_ALREADY_RESPONDED,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  updateSender(
    @CurrentUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateTransactionForwardSenderDto: UpdateTransactionForwardSenderDto,
  ) {
    return this.transactionForwardService.updateSender(
      userId,
      transactionId,
      id,
      updateTransactionForwardSenderDto,
    );
  }

  @Post(':id/response')
  @ApiOperation({ summary: "Respond to a transaction's forward" })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward response created successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    argExtractor: (params) => ({
      forwardId: String(params.id),
      transactionId: String(params.transactionId),
    }),
    matchers: matchRecordsNotFound('TransactionForward'),
  })
  @ApiErrorResponses(
    ErrorCode.NOT_FORWARD_RECEIVER,
    ErrorCode.FORWARD_ALREADY_SEEN,
    ErrorCode.FORWARD_ALREADY_RESPONDED,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  respond(
    @CurrentUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    return this.transactionForwardService.updateResponse(
      userId,
      transactionId,
      id,
      updateTransactionForwardDto,
    );
  }

  @Patch(':id/response')
  @ApiOperation({ summary: 'Update transaction forward response' })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward response updated successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    argExtractor: (params) => ({
      forwardId: String(params.id),
      transactionId: String(params.transactionId),
    }),
    matchers: matchRecordsNotFound('TransactionForward'),
  })
  @ApiErrorResponses(
    ErrorCode.NOT_FORWARD_RECEIVER,
    ErrorCode.FORWARD_ALREADY_SEEN,
    ErrorCode.FORWARD_ALREADY_RESPONDED,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  updateResponse(
    @CurrentUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    return this.transactionForwardService.updateResponse(
      userId,
      transactionId,
      id,
      updateTransactionForwardDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: "Undo a transaction's forward" })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward removed successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    argExtractor: (params) => ({
      forwardId: String(params.id),
      transactionId: String(params.transactionId),
    }),
    matchers: matchRecordsNotFound('TransactionForward'),
  })
  @ApiErrorResponses(
    ErrorCode.NOT_FORWARD_SENDER,
    ErrorCode.FORWARD_ALREADY_SEEN,
    ErrorCode.TRANSACTION_ALREADY_FULFILLED,
  )
  remove(
    @CurrentUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionForwardService.remove(userId, transactionId, id);
  }
}
