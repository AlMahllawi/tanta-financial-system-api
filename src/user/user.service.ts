import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from 'prisma/generated/enums';
import { instanceToInstance } from 'class-transformer';

const dummyUser = new User();
dummyUser.name = 'AlMahllawi';
dummyUser.active = true;
dummyUser.role = UserRole.ADMIN;
dummyUser.createdAt = new Date();
dummyUser.lastLogin = new Date();
dummyUser.hashedPassword = '#password';
dummyUser.departmentName = 'Financial';

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    const user = instanceToInstance(dummyUser);
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
    return [dummyUser];
  }

  findOne(name: string) {
    const user = instanceToInstance(dummyUser);
    user.name = name;
    return user;
  }

  update(name: string, updateUserDto: UpdateUserDto) {
    dummyUser.name = updateUserDto.name ?? name;
    if (updateUserDto.password)
      dummyUser.hashedPassword = `#${updateUserDto.password}`;
    if (updateUserDto.active) dummyUser.active = updateUserDto.active;
    if (updateUserDto.role) dummyUser.role = updateUserDto.role;
    if (updateUserDto.departmentName)
      dummyUser.departmentName = updateUserDto.departmentName;
    return dummyUser;
  }

  remove(name: string) {
    dummyUser.name = name;
    return dummyUser;
  }
}
