import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Scrapers become user-owned and offer deduplication moves to a per-target key.
 *
 * - scrape_targets gains a NOT NULL `userId` (owner) and its uniqueness becomes
 *   (userId, source, query, location) so different accounts (and the same
 *   account) can run distinct searches.
 * - job_offers uniqueness changes from (source, sourceUrl) to
 *   (scrapeTargetId, sourceUrl): the same offer may be found by several
 *   scrapers and each keeps its own copy.
 *
 * Existing scraped data is wiped (clean start) since old rows have no owner and
 * the old global dedup cannot be back-mapped to per-target copies.
 */
export class ScraperPerUserAndDedup1781523528504 implements MigrationInterface {
  name = 'ScraperPerUserAndDedup1781523528504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) wipe scraped data (clean start)
    await queryRunner.query(`DELETE FROM "job_offers" WHERE "scrapeTargetId" IS NOT NULL`);
    await queryRunner.query(`DELETE FROM "scrape_targets"`);

    // 2) job_offers: per-target dedup
    await queryRunner.query(`DROP INDEX "public"."IDX_4d4d1a64701683986fc38543a3"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_job_offers_target_url" ON "job_offers" ("scrapeTargetId", "sourceUrl")`,
    );

    // 3) scrape_targets: owner + new uniqueness
    await queryRunner.query(`ALTER TABLE "scrape_targets" ADD "userId" uuid NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_scrape_targets_user" ON "scrape_targets" ("userId")`);
    await queryRunner.query(`DROP INDEX "public"."IDX_162359182bfa338ac6e63f275f"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_scrape_targets_user_query" ON "scrape_targets" ("userId", "source", "query", "location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_scrape_targets_user_query"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_162359182bfa338ac6e63f275f" ON "scrape_targets" ("source", "query", "location")`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_scrape_targets_user"`);
    await queryRunner.query(`ALTER TABLE "scrape_targets" DROP COLUMN "userId"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_job_offers_target_url"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4d4d1a64701683986fc38543a3" ON "job_offers" ("source", "sourceUrl")`,
    );
  }
}
