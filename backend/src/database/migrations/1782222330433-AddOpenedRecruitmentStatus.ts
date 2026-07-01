import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpenedRecruitmentStatus1782222330433 implements MigrationInterface {
  name = 'AddOpenedRecruitmentStatus1782222330433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."recruitments_status_enum" ADD VALUE IF NOT EXISTS 'OPENED'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing enum values.
  }
}
