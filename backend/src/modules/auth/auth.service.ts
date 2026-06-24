import { randomUUID } from 'crypto';

import { AuthTokens, JwtPayload, LoginResponse, Role } from '../../shared';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

import { RefreshToken } from './refresh-token.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  // ── Registration / activation ───────────────────────────────
  async register(username: string, password: string, email?: string): Promise<{ activationToken?: string }> {
    const existing = await this.users.findByUsernameWithSecrets(username);
    if (existing) {
      throw new BadRequestException('Username already taken');
    }

    const activationToken = randomUUID();
    await this.users.create({
      username,
      email: email ?? null,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: Role.USER,
      isActive: false,
      activationToken,
    });
    // The token would normally be delivered by an activation email. Until that
    // infrastructure exists it is exposed only outside production.
    return { activationToken: this.devToken(activationToken, 'activation') };
  }

  async activate(token: string): Promise<void> {
    const user = await this.users.findBySecret('activationToken', token);
    if (!user) {
      throw new BadRequestException('Invalid activation token');
    }
    await this.users.update(user.id, { isActive: true, activationToken: null });
  }

  // ── Login / refresh / logout ────────────────────────────────
  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.users.findByUsernameWithSecrets(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account not activated');
    }

    await this.users.update(user.id, { lastLoginAt: new Date() });
    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefresh(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { userId: payload.sub, revokedAt: undefined },
      order: { createdAt: 'DESC' },
    });
    if (!stored || !(await bcrypt.compare(refreshToken, stored.tokenHash))) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // rotation: revoke old, issue new
    await this.refreshRepo.update(stored.id, { revokedAt: new Date() });
    const user = await this.users.getByIdOrThrow(payload.sub);
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshRepo.update({ userId, revokedAt: undefined }, { revokedAt: new Date() });
  }

  // ── Password management ─────────────────────────────────────
  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const user = await this.users.findByEmailWithSecrets(email);
    // Always answer the same way so the endpoint can't be used to probe which
    // emails are registered.
    if (!user) {
      return {};
    }
    const resetToken = randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 30);
    await this.users.update(user.id, { resetToken, resetTokenExpiresAt: expires });
    return { resetToken: this.devToken(resetToken, 'password-reset') };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.users.findBySecret('resetToken', token);
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS),
      resetToken: null,
      resetTokenExpiresAt: null,
    });
    await this.logout(user.id);
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await this.users.findByUsernameWithSecrets(
      (await this.users.getByIdOrThrow(userId)).username,
    );
    if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.users.update(userId, {
      passwordHash: await bcrypt.hash(next, SALT_ROUNDS),
    });
    await this.logout(userId);
  }

  // ── helpers ─────────────────────────────────────────────────
  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessTtl'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.refreshSecret'),
      expiresIn: this.config.get('jwt.refreshTtl'),
    });
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, SALT_ROUNDS),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      }),
    );
    return { accessToken, refreshToken };
  }

  private verifyRefresh(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Activation / reset tokens are meant to reach the user by email. That
   * infrastructure isn't wired up yet, so in production the token is only logged
   * server-side and never returned to the client; outside production it is
   * returned to keep local development frictionless.
   */
  private devToken(token: string, kind: string): string | undefined {
    if (this.config.get('NODE_ENV') === 'production') {
      this.logger.log(`Generated ${kind} token (would be emailed to the user)`);
      return undefined;
    }
    return token;
  }
}
