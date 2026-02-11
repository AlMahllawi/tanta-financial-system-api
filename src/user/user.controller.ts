import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: User })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({ status: 200, type: [User] })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a user' })
  @ApiResponse({ status: 200, type: User })
  findOne(@Param('name') name: string) {
    return this.userService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: User })
  update(@Param('name') name: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(name, updateUserDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, type: User })
  remove(@Param('name') name: string) {
    return this.userService.remove(name);
  }
}
