import { ScrapeRequest, ScrapedOfferDto } from '@evpanel/shared';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Calls the stateless scraper worker. The scraper runs one scrape and returns
 * RAW offers; this backend normalizes + persists them. Reachable only on the
 * internal network (not via nginx).
 */
@Injectable()
export class ScraperClient {
  private readonly logger = new Logger(ScraperClient.name);

  constructor(private readonly config: ConfigService) {}

  async scrape(req: ScrapeRequest): Promise<ScrapedOfferDto[]> {
    const base = this.config.get<string>('SCRAPER_INTERNAL_URL') ?? 'http://scraper:3100';
    const token = this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
    try {
      const res = await fetch(`${base}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-token': token },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) {
        throw new HttpException(`Scraper returned ${res.status}`, 502);
      }
      return (await res.json()) as ScrapedOfferDto[];
    } catch (err) {
      this.logger.error(`Scrape request failed: ${(err as Error).message}`);
      if (err instanceof HttpException) throw err;
      throw new HttpException('Scraper worker unreachable', 502);
    }
  }
}
