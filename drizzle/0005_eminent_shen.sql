ALTER TABLE "endpoint_definitions" ADD COLUMN "auth_type" text DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE "endpoint_definitions" ADD COLUMN "auth_config" jsonb;