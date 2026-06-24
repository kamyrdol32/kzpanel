import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToRecruitments1782222330426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recruitments"
      ADD COLUMN IF NOT EXISTS "userId" uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_recruitments_userId"
      ON "recruitments" ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "recruitments"
      ADD CONSTRAINT "FK_recruitments_userId"
      FOREIGN KEY ("userId") REFERENCES "users" ("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recruitments"
      DROP CONSTRAINT IF EXISTS "FK_recruitments_userId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_recruitments_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "recruitments"
      DROP COLUMN IF EXISTS "userId"
    `);
  }
}
