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
  UseFilters,
} from '@nestjs/common';
import { TransactionForwardService } from './transaction-forward.service.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { UpdateTransactionForwardSenderDto } from './dto/update-transaction-forward-sender.dto.js';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';

@ApiTags('Transaction Forwards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
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
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { transactionId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'transactionId',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Sender not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_SENDER_NOT_FOUND,
      args: { senderId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'senderId',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Receiver not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_RECEIVER_NOT_FOUND,
      args: { receiverId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'receiverId',
      },
    },
  )
  @ApiErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
      errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Only the transaction creator can create the first forward',
      errorCode: ErrorCode.NOT_TRANSACTION_CREATOR,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Only the latest forward receiver can forward it',
      errorCode: ErrorCode.NOT_LATEST_RECEIVER,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Must respond to the forward before forwarding it again',
      errorCode: ErrorCode.FORWARD_NOT_RESPONDED,
      args: { transactionId: 1 },
    },
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
  @ApiOkResponse({
    type: [TransactionForward],
    description: 'Transaction forwards retrieved successfully',
  })
  findAll(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.transactionForwardService.findAll(transactionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction forward' })
  @ApiOkResponse({
    type: TransactionForward,
    description: 'Transaction forward retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    args: { id: 1, transactionId: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
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
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    args: { id: 1, transactionId: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  updateSender(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateTransactionForwardSenderDto: UpdateTransactionForwardSenderDto,
  ) {
    return this.transactionForwardService.updateSender(
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
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    args: { id: 1, transactionId: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Only the receiver can respond to this forward',
      errorCode: ErrorCode.NOT_FORWARD_RECEIVER,
      args: { id: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Cannot respond if the sender has already seen the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_SEEN,
      args: { id: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Cannot respond if the transaction has been forwarded again',
      errorCode: ErrorCode.FORWARD_ALREADY_RESPONDED,
      args: { id: 1 },
    },
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
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    args: { id: 1, transactionId: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Only the receiver can respond to this forward',
      errorCode: ErrorCode.NOT_FORWARD_RECEIVER,
      args: { id: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Cannot respond if the sender has already seen the forward',
      errorCode: ErrorCode.FORWARD_ALREADY_SEEN,
      args: { id: 1 },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Cannot respond if the transaction has been forwarded again',
      errorCode: ErrorCode.FORWARD_ALREADY_RESPONDED,
      args: { id: 1 },
    },
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
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
    args: { id: 1, transactionId: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  remove(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionForwardService.remove(transactionId, id);
  }
}
