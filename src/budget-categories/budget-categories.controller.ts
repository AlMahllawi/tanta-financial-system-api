import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BudgetCategoriesService } from './budget-categories.service.js';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto.js';
import { CreateBudgetEntryDto } from './dto/create-budget-entry.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../prisma/generated/enums.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  BudgetCategory,
  BudgetEntry,
} from './entities/budget-category.entity.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import {
  matchRecordsNotFound,
  matchForeignConstraint,
  matchUniqueConstraint,
  matchDriverAdapter,
} from '../prisma/prisma.matchers.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { BudgetCategoryQueryDto } from './dto/budget-category-query.dto.js';
import { BudgetEntryQueryDto } from './dto/budget-entry-query.dto.js';

@ApiTags('Budget Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budget-categories')
export class BudgetCategoriesController {
  constructor(
    private readonly budgetCategoriesService: BudgetCategoriesService,
  ) {}

  @Post(':name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a budget category' })
  @ApiCreatedResponse({
    type: BudgetCategory,
    description: 'Budget category created successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.CONFLICT,
    description: 'A budget category already exists with the same name',
    errorCode: ErrorCode.BUDGET_CATEGORY_ALREADY_EXISTS,
    args: { name: 'Engineering' },
    matchers: matchUniqueConstraint('name'),
  })
  create(@Param('name') name: string) {
    return this.budgetCategoriesService.create(name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budget categories' })
  @ApiPaginatedResponse(BudgetCategory, 'Paged list of budget categories')
  findAll(@Query() queryDto: BudgetCategoryQueryDto) {
    return this.budgetCategoriesService.findAll(queryDto);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a budget category by name' })
  @ApiOkResponse({
    type: BudgetCategory,
    description: 'Budget category retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
    args: { name: 'Unknown' },
    matchers: matchRecordsNotFound('BudgetCategory'),
  })
  findOne(@Param('name') name: string) {
    return this.budgetCategoriesService.findOne(name);
  }

  @Patch(':name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a budget category name' })
  @ApiOkResponse({
    type: BudgetCategory,
    description: 'Budget category updated successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
    args: { name: 'Unknown' },
    matchers: matchRecordsNotFound('BudgetCategory'),
  })
  update(
    @Param('name') name: string,
    @Body() updateBudgetCategoryDto: UpdateBudgetCategoryDto,
  ) {
    return this.budgetCategoriesService.update(name, updateBudgetCategoryDto);
  }

  @Delete(':name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a budget category' })
  @ApiOkResponse({
    type: BudgetCategory,
    description: 'Budget category deleted successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
    args: { name: 'Unknown' },
    matchers: matchRecordsNotFound('BudgetCategory'),
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.CONFLICT,
    description: 'Budget category is in use',
    errorCode: ErrorCode.BUDGET_CATEGORY_IN_USE,
    args: { name: 'Engineering' },
    matchers: matchDriverAdapter('23001', 'fk_transaction_budget'),
  })
  remove(@Param('name') name: string) {
    return this.budgetCategoriesService.remove(name);
  }

  @Get(':name/entry')
  @ApiOperation({ summary: 'List budget entries for a category' })
  @ApiPaginatedResponse(BudgetEntry, 'Paged list of budget entries')
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
    args: { name: 'Unknown' },
    matchers: matchRecordsNotFound('BudgetCategory'),
  })
  findAllEntries(
    @Param('name') name: string,
    @Query() queryDto: BudgetEntryQueryDto,
  ) {
    return this.budgetCategoriesService.findAllEntries(name, queryDto);
  }

  @Post(':name/entry')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a budget entry' })
  @ApiCreatedResponse({
    type: BudgetEntry,
    description: 'Budget entry added successfully to the category',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    errorCode: ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
    args: { budgetName: 'Unknown' },
    matchers: matchForeignConstraint('fk_budget_entry'),
  })
  addEntry(
    @Param('name') name: string,
    @Body() dto: CreateBudgetEntryDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.budgetCategoriesService.addEntry(name, dto, userId);
  }

  @Delete(':name/entry/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a budget entry' })
  @ApiOkResponse({
    type: BudgetEntry,
    description: 'Budget entry removed successfully from the category',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget entry not found',
    errorCode: ErrorCode.BUDGET_ENTRY_NOT_FOUND,
    args: { id: 1 },
    matchers: matchRecordsNotFound('BudgetEntry'),
  })
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'Only the last entry can be removed',
    errorCode: ErrorCode.NOT_LATEST_BUDGET_ENTRY,
    args: { id: 1 },
  })
  removeEntry(
    @Param('name') name: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetCategoriesService.removeEntry(name, id);
  }
}
