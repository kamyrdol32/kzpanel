-- Runs once on first DB init (docker-entrypoint-initdb.d).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
