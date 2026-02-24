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
  UseFilters,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles, RolesException } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import {
  matchConstraintField,
  matchConstraintIndex,
  matchModelName,
} from '../prisma/prisma.matchers.js';

const ALLOWED_USER_UPDATE_FIELDS = ['name', 'password'];

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(PrismaExceptionFilter)
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
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: matchConstraintField('name'),
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: matchConstraintIndex('fk_user_department'),
      },
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
    if (role !== UserRole.ADMIN && queryDto.active !== undefined) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'active' },
      );
    }
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
    prisma: {
      error: PrismaError.RecordsNotFound,
      matcher: matchModelName('User'),
    },
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
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: matchConstraintField('name'),
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
      prisma: {
        error: PrismaError.RecordsNotFound,
        matcher: matchModelName('User'),
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: matchConstraintIndex('fk_user_department'),
      },
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

      if (forbiddenFields.length > 0) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.RESTRICTED_FIELD_UPDATE,
          { fields: forbiddenFields.join(', ') },
        );
      }
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
      prisma: {
        error: PrismaError.RecordsNotFound,
        matcher: matchModelName('User'),
      },
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'Cannot delete a user who manages a department',
      errorCode: ErrorCode.USER_MANAGES_DEPARTMENT,
      args: { id: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: matchConstraintIndex('fk_department_manager'),
      },
    },
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
