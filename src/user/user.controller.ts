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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponses(
    {
      status: HttpStatus.CREATED,
      type: User,
      description: 'User created successfully',
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
    },
  )
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [User],
    description: 'Users retrieved successfully',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: User,
      description: 'User retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
    },
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: User,
      description: 'User updated successfully',
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'A user already exists with the same name',
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
      args: { name: 'John Doe' },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
    },
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: User,
      description: 'User deleted successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No user was found with such id',
      errorCode: ErrorCode.USER_NOT_FOUND,
      args: { id: 1 },
    },
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
