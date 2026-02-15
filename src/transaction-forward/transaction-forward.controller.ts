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
import { TransactionForwardService } from './transaction-forward.service.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

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
  @ApiResponses(
    {
      status: HttpStatus.CREATED,
      type: TransactionForward,
      description: 'Transaction forwarded successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_TRANSACTION_NOT_FOUND,
      args: { transactionId: 1 },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Sender not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_SENDER_NOT_FOUND,
      args: { senderId: 1 },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Receiver not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_RECEIVER_NOT_FOUND,
      args: { receiverId: 1 },
    },
  )
  create(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() createTransactionForwardDto: CreateTransactionForwardDto,
    @CurrentUser('id') senderId: number,
  ) {
    return this.transactionForwardService.create(
      senderId,
      transactionId,
      createTransactionForwardDto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all transaction's forwards" })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [TransactionForward],
    description: 'Transaction forwards retrieved successfully',
  })
  findAll(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.transactionForwardService.findAll(transactionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction forward' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TransactionForward,
      description: 'Transaction forward retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction forward not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
      args: { id: 1, transactionId: 1 },
    },
  )
  findOne(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionForwardService.findOne(transactionId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Respond to a transaction's forward" })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TransactionForward,
      description: 'Transaction forward updated successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction forward not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
      args: { id: 1, transactionId: 1 },
    },
  )
  update(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    return this.transactionForwardService.update(
      transactionId,
      id,
      updateTransactionForwardDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: "Undo a transaction's forward" })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TransactionForward,
      description: 'Transaction forward removed successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction forward not found',
      errorCode: ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
      args: { id: 1, transactionId: 1 },
    },
  )
  remove(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionForwardService.remove(transactionId, id);
  }
}
