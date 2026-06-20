import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds job_offers.employmentTypes (jsonb array): B2B / PERMANENT / MANDATE / OTHER. */
export class OfferEmploymentTypes1781523528506 implements MigrationInterface {
  name = 'OfferEmploymentTypes1781523528506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_offers" ADD "employmentTypes" jsonb NOT NULL DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_offers" DROP COLUMN "employmentTypes"`);
  }
}
