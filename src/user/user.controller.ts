import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a user' })
  findOne(@Param('name') name: string) {
    return this.userService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: "Changes a user's password" })
  changePassword(
    @Param('name') name: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(name, changePasswordDto);
  }
}
