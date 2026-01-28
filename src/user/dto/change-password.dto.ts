import { IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsStrongPassword()
  password: string;
}
