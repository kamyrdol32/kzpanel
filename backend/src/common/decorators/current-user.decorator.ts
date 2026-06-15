import { JwtPayload } from '@evpanel/shared';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the authenticated user (JWT payload) into a route handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
