import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';

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
  @ApiOperation({ summary: "Changes a user's password" })
  @ApiResponse({ status: 200, type: User })
  changePassword(
    @Param('name') name: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(name, changePasswordDto);
  }
}
