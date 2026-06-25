import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ScraperConfig } from './config/scraper.config';

/**
 * Stateless scraper worker. Exposes a single internal endpoint (POST /scrape)
 * that runs one scrape and returns RAW offers. No DB, no scheduler. Not
 * published via nginx — reachable only on the internal network.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = app.get(ScraperConfig).port;
  await app.listen(port);
  Logger.log(`KŻ-Panel scraper worker started (HTTP :${port})`, 'Bootstrap');
}

void bootstrap();
