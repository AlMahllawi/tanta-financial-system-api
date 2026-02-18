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
  ForbiddenException,
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
import { ApiErrorResponses } from '../common/decorators/error.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter.js';
import { PrismaError } from 'prisma-error-enum';
import { AllowSelf } from '../common/decorators/allow-self.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { STATUS_CODES } from 'node:http';

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
  @ApiErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: (meta) => meta.field === 'name',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'departmentName',
      },
    },
  )
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiOkResponse({
    type: [User],
    description: 'Users retrieved successfully',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user' })
  @ApiOkResponse({
    type: User,
    description: 'User retrieved successfully',
  })
  @ApiErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No user was found with such id',
    errorCode: ErrorCode.USER_NOT_FOUND,
    args: { id: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @AllowSelf()
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    type: User,
    description: 'User updated successfully',
  })
  @ApiErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: (meta) => meta.field === 'name',
      },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
      prisma: { error: PrismaError.RecordsNotFound },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'Department not found',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { departmentName: 'Finance' },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'departmentName',
      },
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: 'Some fields are restricted for non-admin users',
      errorCode: ErrorCode.RESTRICTED_FIELD_UPDATE,
      args: { fields: 'role, active' },
    },
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      const updatingFields = Object.keys(updateUserDto);
      const forbiddenFields = updatingFields.filter(
        (field) => !ALLOWED_USER_UPDATE_FIELDS.includes(field),
      );

      if (forbiddenFields.length > 0) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          message: {
            key: ErrorCode.RESTRICTED_FIELD_UPDATE,
            args: { fields: forbiddenFields.join(', ') },
          },
          error: STATUS_CODES[HttpStatus.FORBIDDEN],
        });
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
  @ApiErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No user was found with such id',
    errorCode: ErrorCode.USER_NOT_FOUND,
    args: { id: 1 },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
