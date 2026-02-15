import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionType } from './entities/transaction-type.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Transaction Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions/types')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction type' })
  @ApiResponses(
    {
      status: HttpStatus.CREATED,
      type: TransactionType,
      description: 'Transaction type created successfully',
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'A transaction type already exists with the same name',
      errorCode: ErrorCode.TRANSACTION_TYPE_ALREADY_EXISTS,
      args: { name: 'Financial' },
    },
  )
  create(
    @Body() createTransactionTypeDto: CreateTransactionTypeDto,
    @CurrentUser('id') creatorId: number,
  ) {
    return this.transactionTypeService.create(
      creatorId,
      createTransactionTypeDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transaction types' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [TransactionType],
    description: 'Transaction types retrieved successfully',
  })
  findAll() {
    return this.transactionTypeService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a transaction type' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TransactionType,
      description: 'Transaction type retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction type was found with such name',
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      args: { name: 'Unknown Type' },
    },
  )
  findOne(@Param('name') name: string) {
    return this.transactionTypeService.findOne(name);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TransactionType,
      description: 'Transaction type deleted successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No transaction type was found with such name',
      errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
      args: { name: 'Unknown Type' },
    },
  )
  remove(@Param('name') name: string) {
    return this.transactionTypeService.remove(name);
  }
}
