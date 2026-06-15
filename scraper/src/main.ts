import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * The scraper runs an HTTP app exposing only an internal trigger endpoint
 * (POST /scrape/run) plus the daily scheduler + TypeORM. It is not published via
 * nginx — reachable only on the docker network.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = parseInt(process.env.SCRAPER_PORT ?? '3100', 10);
  await app.listen(port);
  Logger.log(`EvPanel scraper worker started (HTTP :${port})`, 'Bootstrap');
}

void bootstrap();
