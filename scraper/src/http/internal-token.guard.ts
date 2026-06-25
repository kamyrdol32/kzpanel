import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { ScraperConfig } from '../config/scraper.config';

/**
 * When INTERNAL_API_TOKEN is empty (local dev) the guard is a no-op.
 * Otherwise validates the shared-secret header as defence in depth.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ScraperConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.internalToken;
    if (!expected) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    if (req.headers['x-internal-token'] !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
    return true;
  }
}
