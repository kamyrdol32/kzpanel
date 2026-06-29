import * as http from 'node:http';

import { ScrapeRequest, ScrapedOfferDto } from '../../shared';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SCRAPE_TIMEOUT_MS = 30 * 60 * 1000;

@Injectable()
export class ScraperClient {
  private readonly logger = new Logger(ScraperClient.name);

  constructor(private readonly config: ConfigService) {}

  async scrape(req: ScrapeRequest): Promise<ScrapedOfferDto[]> {
    const base = this.config.get<string>('SCRAPER_INTERNAL_URL') ?? 'http://scraper:3100';
    const token = this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
    try {
      const body = JSON.stringify(req);
      const raw = await this.post(base, '/scrape', body, token);
      return JSON.parse(raw) as ScrapedOfferDto[];
    } catch (err) {
      this.logger.error(`Scrape request failed: ${(err as Error).message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException('Scraper worker unreachable', 502);
    }
  }

  private post(base: string, path: string, body: string, token: string): Promise<string> {
    const url = new URL(path, base);
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 80,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'x-internal-token': token,
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new HttpException(`Scraper returned ${res.statusCode}`, 502));
            res.resume();
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          res.on('error', reject);
        },
      );
      req.setTimeout(SCRAPE_TIMEOUT_MS, () => {
        req.destroy(new Error(`Scrape timed out after ${SCRAPE_TIMEOUT_MS / 60000} minutes`));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
