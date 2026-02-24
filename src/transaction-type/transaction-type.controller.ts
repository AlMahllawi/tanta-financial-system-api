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
  Query,
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
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { TransactionType } from './entities/transaction-type.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';
import { matchConstraintField } from '../prisma/prisma.matchers.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { TransactionTypeQueryDto } from './dto/transaction-type-query.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { ApiException } from '../common/exceptions/api.exception.js';

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
        matcher: matchConstraintField('name'),
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'The specified creator user was not found',
      errorCode: ErrorCode.TRANSACTION_TYPE_CREATOR_NOT_FOUND,
      args: { creatorId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: matchConstraintField('creatorId'),
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
  @ApiPaginatedResponse(TransactionType)
  findAll(
    @Query() queryDto: TransactionTypeQueryDto,
    @CurrentUser('role') role: UserRole,
  ) {
    if (queryDto.creatorId !== undefined && role !== UserRole.ADMIN) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'creatorId' },
      );
    }
    return this.transactionTypeService.findAll(queryDto);
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
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the creator of this transaction type',
    errorCode: ErrorCode.NOT_TRANSACTION_TYPE_CREATOR,
  })
  remove(
    @Param('name') name: string,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.transactionTypeService.remove(name, userId, role);
  }
}
