import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1781523528502 implements MigrationInterface {
    name = 'InitSchema1781523528502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required extensions: uuid_generate_v4() (uuid PKs) + citext (case-insensitive email).
        // Self-contained so the baseline applies to any fresh DB, not only the Docker-init one.
        await queryRunner.query(`
            DO $$ BEGIN
              CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            EXCEPTION WHEN insufficient_privilege THEN NULL;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
              CREATE EXTENSION IF NOT EXISTS "citext";
            EXCEPTION WHEN insufficient_privilege THEN NULL;
            END $$
        `);
        await queryRunner.query(`CREATE TYPE "public"."scrape_targets_source_enum" AS ENUM('NOFLUFFJOBS', 'JUSTJOINIT', 'LINKEDIN', 'BULLDOGJOB', 'PRACUJPL', 'MANUAL')`);
        await queryRunner.query(`CREATE TYPE "public"."scrape_targets_remotetype_enum" AS ENUM('ONSITE', 'HYBRID', 'REMOTE')`);
        await queryRunner.query(`CREATE TABLE "scrape_targets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "source" "public"."scrape_targets_source_enum" NOT NULL, "query" character varying NOT NULL, "location" character varying, "remoteType" "public"."scrape_targets_remotetype_enum", "enabled" boolean NOT NULL DEFAULT true, "lastRunAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_85a8c793895a163e7c80def1c58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_15a1489a8359c64e735cc501b6" ON "scrape_targets" ("source") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_162359182bfa338ac6e63f275f" ON "scrape_targets" ("source", "query", "location") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" citext NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "isActive" boolean NOT NULL DEFAULT false, "activationToken" character varying, "resetToken" character varying, "resetTokenExpiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."deployment_history_status_enum" AS ENUM('SUCCESS', 'FAILED', 'ROLLED_BACK')`);
        await queryRunner.query(`CREATE TABLE "deployment_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "projectId" uuid NOT NULL, "version" character varying, "commitSha" character varying, "status" "public"."deployment_history_status_enum" NOT NULL DEFAULT 'SUCCESS', "deployedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_179d57d92ba2427b7ede36c6474" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdfbdcb850d5a46adf90314bb1" ON "deployment_history" ("projectId") `);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('ACTIVE', 'PAUSED', 'ARCHIVED', 'MAINTENANCE')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" text, "logoUrl" character varying, "githubUrl" character varying, "liveUrl" character varying, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'ACTIVE', "technologies" jsonb NOT NULL DEFAULT '[]', "healthEndpoint" character varying, "lastDeployAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2187088ab5ef2a918473cb9900" ON "projects" ("name") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'INFO', "title" character varying NOT NULL, "body" text, "readAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('ONLINE', 'OFFLINE', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "status" "public"."services_status_enum" NOT NULL DEFAULT 'UNKNOWN', "uptime" double precision NOT NULL DEFAULT '0', "responseTime" integer, "cpu" double precision, "ram" double precision, "disk" double precision, "target" character varying, "lastChecked" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_019d74f7abcdcb5a0113010cb0" ON "services" ("name") `);
        await queryRunner.query(`CREATE TYPE "public"."recruitments_level_enum" AS ENUM('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD')`);
        await queryRunner.query(`CREATE TYPE "public"."recruitments_workmode_enum" AS ENUM('ONSITE', 'HYBRID', 'REMOTE')`);
        await queryRunner.query(`CREATE TYPE "public"."recruitments_status_enum" AS ENUM('NEW', 'CV_SENT', 'INTERVIEW', 'TECHNICAL', 'OFFER', 'REJECTED', 'HIRED')`);
        await queryRunner.query(`CREATE TABLE "recruitments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "company" character varying NOT NULL, "position" character varying NOT NULL, "level" "public"."recruitments_level_enum" NOT NULL DEFAULT 'MID', "workMode" "public"."recruitments_workmode_enum" NOT NULL DEFAULT 'REMOTE', "salaryMin" integer, "salaryMax" integer, "currency" character varying, "appliedAt" TIMESTAMP WITH TIME ZONE, "status" "public"."recruitments_status_enum" NOT NULL DEFAULT 'NEW', "jobOfferId" uuid, "notes" text, CONSTRAINT "PK_4e63272ea2bc161c08ba2257e87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_010e7911a0516bca68dac1e31d" ON "recruitments" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ddd25a0bc659096a335fa0b0da" ON "recruitments" ("jobOfferId") `);
        await queryRunner.query(`CREATE TABLE "metric_samples" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serviceId" uuid NOT NULL, "cpu" double precision, "ram" double precision, "disk" double precision, "responseTime" integer, "sampledAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_21aecc6180afbd6e0f6fcd82b62" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b5cd1399db24d12429dcea5b8d" ON "metric_samples" ("serviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7c4c5f7ba3b75cd88be78d5b9c" ON "metric_samples" ("sampledAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_64a13a6d6d9bb1c9c119a6ab22" ON "metric_samples" ("serviceId", "sampledAt") `);
        await queryRunner.query(`CREATE TYPE "public"."job_offers_remotetype_enum" AS ENUM('ONSITE', 'HYBRID', 'REMOTE')`);
        await queryRunner.query(`CREATE TYPE "public"."job_offers_level_enum" AS ENUM('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD')`);
        await queryRunner.query(`CREATE TYPE "public"."job_offers_language_enum" AS ENUM('PL', 'EN')`);
        await queryRunner.query(`CREATE TYPE "public"."job_offers_source_enum" AS ENUM('NOFLUFFJOBS', 'JUSTJOINIT', 'LINKEDIN', 'BULLDOGJOB', 'PRACUJPL', 'MANUAL')`);
        await queryRunner.query(`CREATE TABLE "job_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "company" character varying NOT NULL, "salaryMin" integer, "salaryMax" integer, "currency" character varying, "location" character varying, "remoteType" "public"."job_offers_remotetype_enum" NOT NULL DEFAULT 'REMOTE', "level" "public"."job_offers_level_enum" NOT NULL DEFAULT 'MID', "language" "public"."job_offers_language_enum" NOT NULL DEFAULT 'PL', "source" "public"."job_offers_source_enum" NOT NULL, "sourceUrl" character varying NOT NULL, "publishedDate" TIMESTAMP WITH TIME ZONE, "description" text, "responsibilities" jsonb NOT NULL DEFAULT '[]', "requirements" jsonb NOT NULL DEFAULT '[]', "mustHave" jsonb NOT NULL DEFAULT '[]', "niceToHave" jsonb NOT NULL DEFAULT '[]', "benefits" jsonb NOT NULL DEFAULT '[]', "techStack" jsonb NOT NULL DEFAULT '[]', "scrapeTargetId" uuid, "dismissed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9a54d36bd6829979f945defdeb5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60c48dd88d0dbd4d5baaba87d1" ON "job_offers" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_fda74ca3c72b733b5de609abef" ON "job_offers" ("source") `);
        await queryRunner.query(`CREATE INDEX "IDX_9bdca1c111e0a5e43b2b8e18e9" ON "job_offers" ("scrapeTargetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_885c2863ea463c22498e49b7cf" ON "job_offers" ("dismissed") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4d4d1a64701683986fc38543a3" ON "job_offers" ("source", "sourceUrl") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_log_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity" character varying NOT NULL, "entityId" uuid, "action" "public"."audit_log_action_enum" NOT NULL, "userId" uuid, "diff" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b7fb5009bdbeb7bf0393975335" ON "audit_log" ("entity") `);
        await queryRunner.query(`CREATE INDEX "IDX_2621409ebc295c5da7ff3e4139" ON "audit_log" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_78e013ffae12f5a1fc1dbefff9" ON "audit_log" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_78e013ffae12f5a1fc1dbefff9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2621409ebc295c5da7ff3e4139"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7fb5009bdbeb7bf0393975335"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TYPE "public"."audit_log_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d4d1a64701683986fc38543a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_885c2863ea463c22498e49b7cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bdca1c111e0a5e43b2b8e18e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fda74ca3c72b733b5de609abef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60c48dd88d0dbd4d5baaba87d1"`);
        await queryRunner.query(`DROP TABLE "job_offers"`);
        await queryRunner.query(`DROP TYPE "public"."job_offers_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_offers_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_offers_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_offers_remotetype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64a13a6d6d9bb1c9c119a6ab22"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c4c5f7ba3b75cd88be78d5b9c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5cd1399db24d12429dcea5b8d"`);
        await queryRunner.query(`DROP TABLE "metric_samples"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ddd25a0bc659096a335fa0b0da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_010e7911a0516bca68dac1e31d"`);
        await queryRunner.query(`DROP TABLE "recruitments"`);
        await queryRunner.query(`DROP TYPE "public"."recruitments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recruitments_workmode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recruitments_level_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_019d74f7abcdcb5a0113010cb0"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2187088ab5ef2a918473cb9900"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdfbdcb850d5a46adf90314bb1"`);
        await queryRunner.query(`DROP TABLE "deployment_history"`);
        await queryRunner.query(`DROP TYPE "public"."deployment_history_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_162359182bfa338ac6e63f275f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15a1489a8359c64e735cc501b6"`);
        await queryRunner.query(`DROP TABLE "scrape_targets"`);
        await queryRunner.query(`DROP TYPE "public"."scrape_targets_remotetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."scrape_targets_source_enum"`);
    }

}
