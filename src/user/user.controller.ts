import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from '../../prisma/generated/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles, RolesException } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import {
  matchDriverAdapter,
  matchForeignConstraint,
  matchRecordsNotFound,
  matchUniqueConstraint,
} from '../prisma/prisma.matchers.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { User } from './entities/user.entity.js';
import { UserService } from './user.service.js';

const ALLOWED_USER_UPDATE_FIELDS = ['name', 'password'];

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    type: User,
    description: 'User created successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
      argExtractor: (_params, body) => ({ name: body.name }),
      matchers: matchUniqueConstraint('name'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      argExtractor: (_params, body) => ({
        departmentName: body.departmentName,
      }),
      matchers: matchForeignConstraint('fk_user_department'),
    },
  )
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiPaginatedResponse(User)
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'Filtering by active status is restricted for non-admin users',
    errorCode: ErrorCode.RESTRICTED_FIELD_UPDATE,
    args: { fields: 'active' },
  })
  findAll(
    @Query() queryDto: UserQueryDto,
    @CurrentUser('role') role: UserRole,
  ) {
    if (role !== UserRole.ADMIN && queryDto.active !== undefined)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'active' },
      );

    return this.userService.findAll(queryDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retrieve the current user' })
  @ApiOkResponse({
    type: User,
    description: 'Current user retrieved successfully',
  })
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user' })
  @ApiOkResponse({
    type: User,
    description: 'User retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No user was found with such id',
    errorCode: ErrorCode.USER_NOT_FOUND,
    args: { id: 1 },
    argExtractor: (params) => ({ id: params.id }),
    matchers: matchRecordsNotFound('User'),
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @RolesException((user, request) => user.id === +request.params.id)
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    type: User,
    description: 'User updated successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
      argExtractor: (_params, body) => ({ name: body.name }),
      matchers: matchUniqueConstraint('name'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchRecordsNotFound('User'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      argExtractor: (_params, body) => ({
        departmentName: body.departmentName,
      }),
      matchers: matchForeignConstraint('fk_user_department'),
    },
  )
  @ApiErrorResponses({
    status: HttpStatus.FORBIDDEN,
    description: 'Some fields are restricted for non-admin users',
    errorCode: ErrorCode.RESTRICTED_FIELD_UPDATE,
    args: { fields: 'role, active' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('role') role: UserRole,
  ) {
    if (role !== UserRole.ADMIN) {
      const updatingFields = Object.keys(updateUserDto).filter(
        (key: keyof UpdateUserDto) => updateUserDto[key] !== undefined,
      );
      const forbiddenFields = updatingFields.filter(
        (field) => !ALLOWED_USER_UPDATE_FIELDS.includes(field),
      );

      if (forbiddenFields.length > 0)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.RESTRICTED_FIELD_UPDATE,
          { fields: forbiddenFields.join(', ') },
        );
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiOkResponse({
    type: User,
    description: 'User deleted successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: matchRecordsNotFound('User'),
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'Cannot delete a user who is engaged in the system',
      errorCode: ErrorCode.USER_ENGAGED_IN_SYSTEM,
      args: { id: 1 },
      argExtractor: (params) => ({ id: params.id }),
      matchers: [
        matchForeignConstraint('fk_department_manager'),
        matchForeignConstraint('fk_document_uploader'),
        matchForeignConstraint('fk_transaction_creator'),
        matchForeignConstraint('fk_transaction_document_attacher'),
        matchForeignConstraint('fk_transaction_type_creator'),
        matchForeignConstraint('fk_transaction_forward_sender'),
        matchForeignConstraint('fk_transaction_forward_receiver'),
        matchForeignConstraint('fk_budget_entry_inputter'),
        matchDriverAdapter('23001', 'fk_department_manager'),
        matchDriverAdapter('23001', 'fk_document_uploader'),
        matchDriverAdapter('23001', 'fk_transaction_creator'),
        matchDriverAdapter('23001', 'fk_transaction_document_attacher'),
        matchDriverAdapter('23001', 'fk_transaction_type_creator'),
        matchDriverAdapter('23001', 'fk_transaction_forward_sender'),
        matchDriverAdapter('23001', 'fk_transaction_forward_receiver'),
        matchDriverAdapter('23001', 'fk_budget_entry_inputter'),
      ],
    },
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
