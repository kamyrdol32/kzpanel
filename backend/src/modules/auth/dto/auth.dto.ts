import {
  ActivateAccountRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../../shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'kamyrdol32' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto implements RegisterRequest {
  @ApiProperty({ example: 'kamyrdol32' })
  @IsString()
  username!: string;

  @ApiPropertyOptional({ example: 'admin@evpanel.dev' })
  @IsEmail()
  @IsOptional()
  email?: string;

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
