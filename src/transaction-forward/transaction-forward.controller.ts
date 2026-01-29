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
@Controller('transaction-forward')
export class TransactionForwardController {
  constructor(
    private readonly transactionForwardService: TransactionForwardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction forward' })
  create(@Body() createTransactionForwardDto: CreateTransactionForwardDto) {
    return this.transactionForwardService.create(createTransactionForwardDto);
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Get all transaction forwards by transaction ID' })
  findAll(@Param('transactionId') transactionId: string) {
    return this.transactionForwardService.findAll(+transactionId);
  }

  @Patch(':transactionId/:id')
  @ApiOperation({ summary: 'Update a transaction forward' })
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

  @Delete(':transactionId/:id')
  @ApiOperation({ summary: 'Delete a transaction forward' })
  remove(
    @Param('transactionId') transactionId: string,
    @Param('id') id: string,
  ) {
    return this.transactionForwardService.remove(+transactionId, +id);
  }
}
