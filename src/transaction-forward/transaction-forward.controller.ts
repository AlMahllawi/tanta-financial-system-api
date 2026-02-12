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
} from '@nestjs/common';
import { TransactionForwardService } from './transaction-forward.service.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

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
  @ApiResponses({
    status: HttpStatus.CREATED,
    type: TransactionForward,
    description: 'Transaction forwarded successfully',
  })
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
  @ApiResponses({
    status: HttpStatus.OK,
    type: [TransactionForward],
    description: 'Transaction forwards retrieved successfully',
  })
  findAll(@Param('transactionId') transactionId: string) {
    return this.transactionForwardService.findAll(+transactionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Respond to a transaction's forward" })
  @ApiResponses({
    status: HttpStatus.OK,
    type: TransactionForward,
    description: 'Transaction forward updated successfully',
  })
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
  @ApiResponses({
    status: HttpStatus.OK,
    type: TransactionForward,
    description: 'Transaction forward removed successfully',
  })
  remove(
    @Param('transactionId') transactionId: string,
    @Param('id') id: string,
  ) {
    return this.transactionForwardService.remove(+transactionId, +id);
  }
}
