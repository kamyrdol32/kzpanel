import { ScrapeRequest, ScrapedOfferDto } from '../../shared';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const { Agent } = require('undici');

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
        signal: AbortSignal.timeout(1_800_000),
        // @ts-expect-error - undici dispatcher, no types needed (bundled with Node.js)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatcher: new Agent({ bodyTimeout: 0, headersTimeout: 0 }),
      });
      if (!res.ok) {
        throw new HttpException(`Scraper returned ${res.status}`, 502);
      }
      return (await res.json()) as ScrapedOfferDto[];
    } catch (err) {
      this.logger.error(`Scrape request failed: ${(err as Error).message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException('Scraper worker unreachable', 502);
    }
  }
}
