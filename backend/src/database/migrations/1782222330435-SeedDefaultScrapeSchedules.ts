import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultScrapeSchedules1782222330435 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "scrape_schedules" ("id", "scrapeTargetId", "recurrenceType", "time", "enabled")
      SELECT uuid_generate_v4(), t."id", 'DAILY', '04:00', true
      FROM "scrape_targets" t
      WHERE t."deletedAt" IS NULL
        AND NOT EXISTS (SELECT 1 FROM "scrape_schedules" s WHERE s."scrapeTargetId" = t."id")
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "scrape_schedules" WHERE "recurrenceType" = 'DAILY' AND "time" = '04:00'`,
    );
  }
}
