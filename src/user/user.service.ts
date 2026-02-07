import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { UserRole } from 'prisma/generated/enums';

const user = new User();
user.name = 'AlMahllawi';
user.active = true;
user.role = UserRole.ADMIN;
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
    user.role = createUserDto.role ?? UserRole.USER;
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

  remove(name: string) {
    user.name = name;
    return user;
  }
}
