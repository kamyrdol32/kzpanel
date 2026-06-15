import { ScrapeRunResult } from '@evpanel/shared';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Calls the scraper worker's internal HTTP trigger. The scraper is reachable
 * only on the docker network (not via nginx). Used by the "Scrape now" button.
 */
@Injectable()
export class ScraperClient {
  private readonly logger = new Logger(ScraperClient.name);

  constructor(private readonly config: ConfigService) {}

  async triggerRun(targetId?: string): Promise<ScrapeRunResult> {
    const base = this.config.get<string>('SCRAPER_INTERNAL_URL') ?? 'http://scraper:3100';
    const token = this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
    try {
      const res = await fetch(`${base}/scrape/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-token': token },
        body: JSON.stringify({ targetId }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) {
        throw new HttpException(`Scraper returned ${res.status}`, 502);
      }
      return (await res.json()) as ScrapeRunResult;
    } catch (err) {
      this.logger.error(`Scrape trigger failed: ${(err as Error).message}`);
      if (err instanceof HttpException) throw err;
      throw new HttpException('Scraper worker unreachable', 502);
    }
  }
}
