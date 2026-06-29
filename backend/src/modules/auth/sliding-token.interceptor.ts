import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable, tap } from 'rxjs';

import { JwtPayload } from '../../shared';

/**
 * Sliding session: on every authenticated request we mint a fresh access token
 * and return it in the `x-access-token` response header. The client swaps in the
 * new token, so an active user's session keeps rolling forward and never expires
 * mid-use. Unauthenticated requests (no req.user) are left untouched.
 */
@Injectable()
export class SlidingTokenInterceptor implements NestInterceptor {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const user = http.getRequest().user as JwtPayload | undefined;
        if (!user) {
          return;
        }
        const token = this.jwt.sign(
          { sub: user.sub, username: user.username, role: user.role, permissions: user.permissions ?? [] },
          {
            secret: this.config.get<string>('jwt.accessSecret'),
            expiresIn: this.config.get<string>('jwt.accessTtl'),
          },
        );
        http.getResponse().setHeader('x-access-token', token);
      }),
    );
  }
}
