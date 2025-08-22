ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueNumber" numeric;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueText" text;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueObject" jsonb;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueUpdatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueSource" text;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastResponseId" text;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD COLUMN "lastValueMeta" jsonb;--> statement-breakpoint
ALTER TABLE "endpoint_operations" ADD COLUMN "responseExtractPath" text;--> statement-breakpoint
ALTER TABLE "endpoint_operations" ADD COLUMN "responseExtractFormat" text;