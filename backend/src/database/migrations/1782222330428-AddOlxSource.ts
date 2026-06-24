import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOlxSource1782222330428 implements MigrationInterface {
  name = 'AddOlxSource1782222330428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."job_offers_source_enum" ADD VALUE IF NOT EXISTS 'OLX'`);
    await queryRunner.query(`ALTER TYPE "public"."scrape_targets_source_enum" ADD VALUE IF NOT EXISTS 'OLX'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing enum values.
  }
}
