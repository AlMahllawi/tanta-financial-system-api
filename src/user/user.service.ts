import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { UserGroups } from 'prisma/generated/enums';

const user = new User();
user.name = 'AlMahllawi';
user.active = true;
user.role = UserGroups.ADMIN;
user.createdAt = new Date();
user.lastLogin = new Date();
user.hashedPassword = '#password';
user.departmentName = 'Financial';

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    const user = new User();
    user.name = createUserDto.name;
    user.departmentName = createUserDto.departmentName;
    user.role = createUserDto.role ?? UserGroups.USER;
    user.active = true;
    user.createdAt = new Date();
    user.lastLogin = null;
    user.hashedPassword = `#${createUserDto.password}`;
    return user;
  }

  // TODO: paginate
  findAll() {
    return [user];
  }

  findOne(name: string) {
    user.name = name;
    return user;
  }

  changePassword(name: string, changePasswordDto: ChangePasswordDto) {
    user.hashedPassword = `#${changePasswordDto.password}`;
    return user;
  }
}
