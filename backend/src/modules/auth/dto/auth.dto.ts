import {
  ActivateAccountRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../../shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin@evpanel.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto implements RegisterRequest {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto implements RefreshRequest {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto implements ResetPasswordRequest {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class ChangePasswordDto implements ChangePasswordRequest {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class ActivateAccountDto implements ActivateAccountRequest {
  @ApiProperty()
  @IsString()
  token!: string;
}
