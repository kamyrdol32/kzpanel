import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncludeAllRemoteToScrapeTargets1782222330429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scrape_targets" ADD COLUMN IF NOT EXISTS "includeAllRemote" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scrape_targets" DROP COLUMN IF EXISTS "includeAllRemote"`);
  }
}
