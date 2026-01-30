import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TransactionForwardService } from './transaction-forward.service';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionForward } from './entities/transaction-forward.entity';

@ApiTags('Transaction Forwards')
@Controller('transaction/:transactionId/forward')
export class TransactionForwardController {
  constructor(
    private readonly transactionForwardService: TransactionForwardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Forward a transaction' })
  @ApiResponse({ status: 201, type: TransactionForward })
  create(
    @Param('transactionId') transactionId: string,
    @Body() createTransactionForwardDto: CreateTransactionForwardDto,
  ) {
    return this.transactionForwardService.create(
      +transactionId,
      createTransactionForwardDto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all transaction's forwards" })
  @ApiResponse({ status: 200, type: [TransactionForward] })
  findAll(@Param('transactionId') transactionId: string) {
    return this.transactionForwardService.findAll(+transactionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Respond to a transaction's forward" })
  @ApiResponse({ status: 200, type: TransactionForward })
  update(
    @Param('transactionId') transactionId: string,
    @Param('id') id: string,
    @Body() updateTransactionForwardDto: UpdateTransactionForwardDto,
  ) {
    return this.transactionForwardService.update(
      +transactionId,
      +id,
      updateTransactionForwardDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: "Undo a transaction's forward" })
  @ApiResponse({ status: 200, type: TransactionForward })
  remove(
    @Param('transactionId') transactionId: string,
    @Param('id') id: string,
  ) {
    return this.transactionForwardService.remove(+transactionId, +id);
  }
}
