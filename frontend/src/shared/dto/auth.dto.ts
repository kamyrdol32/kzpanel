import { Role } from '../enums';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  isActive: boolean;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ActivateAccountRequest {
  token: string;
}

/** JWT payload carried in access/refresh tokens. */
export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}
