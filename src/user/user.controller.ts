import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiExceptionResponse } from '../common/dto/http-exception.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: User, description: 'User created successfully' })
  @ApiConflictResponse({
    type: ApiExceptionResponse(409, 'Conflict', ErrorCode.USER_ALREADY_EXISTS, {
      name: 'John Doe',
    }),
    description: 'A user already exists with the same name',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiOkResponse({ type: [User], description: 'Users retrieved successfully' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a user' })
  @ApiOkResponse({ type: User, description: 'User retrieved successfully' })
  @ApiNotFoundResponse({
    type: ApiExceptionResponse(404, 'Not Found', ErrorCode.USER_NOT_FOUND, {
      name: 'John Doe',
    }),
    description: 'No user was found with such name',
  })
  findOne(@Param('name') name: string) {
    return this.userService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    type: User,
    description: 'User updated successfully',
  })
  @ApiConflictResponse({
    type: ApiExceptionResponse(409, 'Conflict', ErrorCode.USER_ALREADY_EXISTS, {
      name: 'John Doe',
    }),
    description: 'A user already exists with the same name',
  })
  @ApiNotFoundResponse({
    type: ApiExceptionResponse(404, 'Not Found', ErrorCode.USER_NOT_FOUND, {
      name: 'John Doe',
    }),
    description: 'No user was found with such name',
  })
  update(@Param('name') name: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(name, updateUserDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiOkResponse({ type: User, description: 'User deleted successfully' })
  @ApiNotFoundResponse({
    type: ApiExceptionResponse(404, 'Not Found', ErrorCode.USER_NOT_FOUND, {
      name: 'John Doe',
    }),
    description: 'No user was found with such name',
  })
  remove(@Param('name') name: string) {
    return this.userService.remove(name);
  }
}
