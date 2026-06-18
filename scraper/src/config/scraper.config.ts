import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Typed access to scraper-related environment configuration. */
@Injectable()
export class ScraperConfig {
  constructor(private readonly config: ConfigService) {}

  /** Generate a synthetic offer instead of hitting the live portal (testing). */
  get mock(): boolean {
    return this.config.get('SCRAPER_MOCK') === 'true';
  }

  /** Shared secret guarding the internal /scrape endpoint. */
  get internalToken(): string {
    return this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
  }

  /** HTTP port for the internal trigger endpoint. */
  get port(): number {
    return parseInt(this.config.get<string>('SCRAPER_PORT') ?? '3100', 10);
  }

  /** Proxy URL passed to Playwright (and respected by Node fetch via HTTP_PROXY env). e.g. http://user:pass@host:port */
  get proxyUrl(): string | undefined {
    return this.config.get<string>('PROXY_URL') || undefined;
  }
}
