import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    return `This action creates a new user with name (${createUserDto.name}) with passowrd "${createUserDto.password}" in group ${createUserDto.group}`;
  }

  // TODO: paginate
  findAll() {
    return `This action returns all users`;
  }

  findOne(name: string) {
    return `This action returns a the user with the name (${name})`;
  }

  changePassword(name: string, changePasswordDto: ChangePasswordDto) {
    return `This action changes the user (${name})'s password to be "${changePasswordDto.password}"`;
  }
}
