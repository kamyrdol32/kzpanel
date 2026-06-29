import { MigrationInterface, QueryRunner } from 'typeorm';

// Demo account for the portfolio: username "test", password "test", active,
// with read-only-ish permissions (browse offers and recruitment, no scraping).
// The hash is a bcrypt (12 rounds) digest of "test". Idempotent: skipped when a
// user named "test" already exists (username is citext, so case-insensitive).
const TEST_PASSWORD_HASH = '$2b$12$MUIWbS7a8Psw450Bp76Wsu.Y1rwHrGy8rF74Sfyw3uOQ9pyiE9QIi';

export class SeedTestAccount1782222330432 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "users" ("id", "username", "passwordHash", "role", "permissions", "isActive")
      SELECT uuid_generate_v4(), 'test', $1, 'USER', 'JOBS_VIEW,RECRUITMENT_MANAGE', true
      WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "username" = 'test')
      `,
      [TEST_PASSWORD_HASH],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "username" = 'test'`);
  }
}
