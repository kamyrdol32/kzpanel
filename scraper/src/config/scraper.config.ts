import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScraperConfig {
  constructor(private readonly config: ConfigService) {}

  get mock(): boolean {
    return this.config.get('SCRAPER_MOCK') === 'true';
  }

  get internalToken(): string {
    return this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
  }

  get port(): number {
    return parseInt(this.config.get<string>('SCRAPER_PORT') ?? '3100', 10);
  }

  /** Proxy URL passed to Playwright (and respected by Node fetch via HTTP_PROXY env). e.g. http://user:pass@host:port */
  get proxyUrl(): string | undefined {
    return this.config.get<string>('PROXY_URL') || undefined;
  }

  get chromiumPath(): string | undefined {
    return this.config.get<string>('CHROMIUM_PATH') || undefined;
  }
}
