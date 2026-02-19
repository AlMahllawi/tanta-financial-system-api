import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionType } from './entities/transaction-type.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';

@ApiTags('Transaction Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
@Controller('transactions/types')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction type' })
  @ApiCreatedResponse({
    type: TransactionType,
    description: 'Transaction type created successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A transaction type already exists with the same name',
      errorCode: ErrorCode.TRANSACTION_TYPE_ALREADY_EXISTS,
      args: { name: 'Financial' },
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: (meta) => meta.field === 'name',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'The specified creator user was not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_CREATOR_NOT_FOUND,
      args: { creatorId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'creatorId',
      },
    },
  )
  create(
    @CurrentUser('id') creatorId: number,
    @Body() createTransactionTypeDto: CreateTransactionTypeDto,
  ) {
    return this.transactionTypeService.create(
      creatorId,
      createTransactionTypeDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transaction types' })
  @ApiOkResponse({
    type: [TransactionType],
    description: 'Transaction types retrieved successfully',
  })
  findAll() {
    return this.transactionTypeService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a transaction type' })
  @ApiOkResponse({
    type: TransactionType,
    description: 'Transaction type retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction type was found with such name',
    errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
    args: { name: 'Unknown Type' },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  findOne(@Param('name') name: string) {
    return this.transactionTypeService.findOne(name);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiOkResponse({
    type: TransactionType,
    description: 'Transaction type deleted successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No transaction type was found with such name',
    errorCode: ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
    args: { name: 'Unknown Type' },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  remove(@Param('name') name: string) {
    return this.transactionTypeService.remove(name);
  }
}
