import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

// Load .env from repo root when running the TypeORM CLI.
loadEnv({ path: process.env.ENV_PATH ?? '.env' });

/**
 * Standalone DataSource used by the TypeORM CLI (migrations) AND re-used by the
 * Nest TypeOrmModule (see app.module.ts) so both share one set of options.
 */
export const dataSourceOptions = {
  type: 'postgres' as const,
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'evpanel',
  password: process.env.POSTGRES_PASSWORD ?? 'evpanel',
  database: process.env.POSTGRES_DB ?? 'evpanel',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // NEVER true in production — use migrations. Opt-in via DB_SYNC for first-run/dev.
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(dataSourceOptions);
