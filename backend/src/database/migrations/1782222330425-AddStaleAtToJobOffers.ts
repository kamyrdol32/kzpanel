import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaleAtToJobOffers1782222330425 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE job_offers
      ADD COLUMN IF NOT EXISTS "staleAt" TIMESTAMPTZ DEFAULT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE job_offers
      DROP COLUMN IF EXISTS "staleAt"
    `);
  }
}
