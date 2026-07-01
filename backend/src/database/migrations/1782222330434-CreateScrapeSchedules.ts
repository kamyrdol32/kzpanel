import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScrapeSchedules1782222330434 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."scrape_schedules_recurrencetype_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "scrape_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "scrapeTargetId" uuid NOT NULL, "recurrenceType" "public"."scrape_schedules_recurrencetype_enum" NOT NULL, "time" character varying(5) NOT NULL, "daysOfWeek" integer array, "dayOfMonth" smallint, "enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_scrape_schedules_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_scrape_schedules_target" ON "scrape_schedules" ("scrapeTargetId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_scrape_schedules_enabled_time" ON "scrape_schedules" ("enabled", "time") `,
    );
    await queryRunner.query(
      `ALTER TABLE "scrape_schedules" ADD CONSTRAINT "FK_scrape_schedules_target" FOREIGN KEY ("scrapeTargetId") REFERENCES "scrape_targets"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scrape_schedules" DROP CONSTRAINT "FK_scrape_schedules_target"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_scrape_schedules_enabled_time"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_scrape_schedules_target"`);
    await queryRunner.query(`DROP TABLE "scrape_schedules"`);
    await queryRunner.query(`DROP TYPE "public"."scrape_schedules_recurrencetype_enum"`);
  }
}
