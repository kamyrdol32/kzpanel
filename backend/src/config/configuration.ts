export interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.BACKEND_PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? 'evpanel',
    password: process.env.POSTGRES_PASSWORD ?? 'evpanel',
    name: process.env.POSTGRES_DB ?? 'evpanel',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
});
