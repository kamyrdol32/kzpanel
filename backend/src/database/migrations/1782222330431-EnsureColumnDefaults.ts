import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureColumnDefaults1782222330431 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isActive" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "permissions" SET DEFAULT ''`);
    await queryRunner.query(`UPDATE "users" SET "isActive" = false WHERE "isActive" IS NULL`);
    await queryRunner.query(`UPDATE "users" SET "permissions" = '' WHERE "permissions" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isActive" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "permissions" DROP DEFAULT`);
  }
}
