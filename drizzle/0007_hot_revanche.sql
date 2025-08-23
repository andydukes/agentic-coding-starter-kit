ALTER TABLE "attribute_definitions" ADD COLUMN "execHeaders" jsonb;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "execBody" jsonb;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "execAuthRef" text;