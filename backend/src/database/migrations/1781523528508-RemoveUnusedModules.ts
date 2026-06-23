import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the tables of modules removed to keep the codebase focused on the
 * job-aggregator + recruitment core (projects, monitoring, notifications).
 * Forward-only — these domains no longer exist in the code.
 */
export class RemoveUnusedModules1781523528508 implements MigrationInterface {
  name = 'RemoveUnusedModules1781523528508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deployment_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "metric_samples" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."deployment_history_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."projects_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."services_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notifications_type_enum"`);
  }

  public async down(): Promise<void> {
    // Forward-only: the removed modules are no longer part of the schema.
  }
}
