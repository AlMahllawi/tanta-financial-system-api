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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Transaction Forwards')
@Controller('transaction/:transactionId/forward')
export class TransactionForwardController {
  constructor(
    private readonly transactionForwardService: TransactionForwardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Forward a transaction' })
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
  findAll(@Param('transactionId') transactionId: string) {
    return this.transactionForwardService.findAll(+transactionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Respond to a transaction's forward" })
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
  remove(
    @Param('transactionId') transactionId: string,
    @Param('id') id: string,
  ) {
    return this.transactionForwardService.remove(+transactionId, +id);
  }
}
