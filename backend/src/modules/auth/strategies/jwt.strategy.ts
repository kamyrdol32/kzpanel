import { JwtPayload } from '../../../shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  // Role and permissions come from a cached lookup (invalidated whenever the user
  // is changed), so an admin's change takes effect without that user re-logging
  // in, and without a database read on every request.
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const info = await this.users.getAuthInfo(payload.sub);
    return {
      sub: payload.sub,
      username: payload.username,
      role: info?.role ?? payload.role,
      permissions: info?.permissions ?? payload.permissions ?? [],
    };
  }
}
