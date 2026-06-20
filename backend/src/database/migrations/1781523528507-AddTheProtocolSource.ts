import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the THEPROTOCOL value to the job source enums (job_offers + scrape_targets).
 * Postgres enums only grow — there is no DROP VALUE, so down() is a no-op.
 */
export class AddTheProtocolSource1781523528507 implements MigrationInterface {
  name = 'AddTheProtocolSource1781523528507';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."job_offers_source_enum" ADD VALUE IF NOT EXISTS 'THEPROTOCOL'`);
    await queryRunner.query(`ALTER TYPE "public"."scrape_targets_source_enum" ADD VALUE IF NOT EXISTS 'THEPROTOCOL'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing enum values.
  }
}
