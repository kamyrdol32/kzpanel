import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * job_offers.level / remoteType (single enum) → levels / remoteTypes (jsonb
 * arrays). An offer can legitimately target several seniority levels or work
 * modes; we now keep them all. Existing singular values are backfilled into a
 * one-element array so nothing is lost.
 */
export class OfferMultiLevelMode1781523528505 implements MigrationInterface {
  name = 'OfferMultiLevelMode1781523528505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_offers" ADD "levels" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "job_offers" ADD "remoteTypes" jsonb NOT NULL DEFAULT '[]'`);

    await queryRunner.query(`UPDATE "job_offers" SET "levels" = to_jsonb(ARRAY["level"::text]) WHERE "level" IS NOT NULL`);
    await queryRunner.query(
      `UPDATE "job_offers" SET "remoteTypes" = to_jsonb(ARRAY["remoteType"::text]) WHERE "remoteType" IS NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "job_offers" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "job_offers" DROP COLUMN "remoteType"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_offers" ADD "remoteType" "public"."job_offers_remotetype_enum" NOT NULL DEFAULT 'REMOTE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_offers" ADD "level" "public"."job_offers_level_enum" NOT NULL DEFAULT 'MID'`,
    );
    await queryRunner.query(
      `UPDATE "job_offers" SET "level" = ("levels"->>0)::"public"."job_offers_level_enum" WHERE jsonb_array_length("levels") > 0`,
    );
    await queryRunner.query(
      `UPDATE "job_offers" SET "remoteType" = ("remoteTypes"->>0)::"public"."job_offers_remotetype_enum" WHERE jsonb_array_length("remoteTypes") > 0`,
    );
    await queryRunner.query(`ALTER TABLE "job_offers" DROP COLUMN "remoteTypes"`);
    await queryRunner.query(`ALTER TABLE "job_offers" DROP COLUMN "levels"`);
  }
}
