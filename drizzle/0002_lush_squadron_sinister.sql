-- Step 1: add columns as nullable
ALTER TABLE "model" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "model" ADD COLUMN "modelId" text;--> statement-breakpoint
ALTER TABLE "model" ADD COLUMN "attributes" jsonb;--> statement-breakpoint

-- Step 2: backfill existing rows from legacy columns with safe placeholders
UPDATE "model"
SET
  "type" = COALESCE("type", 'model'),
  "modelId" = COALESCE("modelId", "id"),
  "attributes" = COALESCE(
    "attributes",
    jsonb_build_object(
      'name', COALESCE("name", ''),
      'description', COALESCE("description", ''),
      'metadata', jsonb_build_object(
        'prediction', jsonb_build_object(
          'domain', jsonb_build_object('type', 'DomainC', 'values', jsonb_build_array()),
          'name', 'PREDICTION',
          'question', '',
          'type', 'Nominal'
        ),
        'attributes', jsonb_build_array()
      ),
      'publisher', '',
      'publish-date', ''
    )
  );--> statement-breakpoint

-- Step 3: enforce NOT NULL after backfill
ALTER TABLE "model" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "model" ALTER COLUMN "modelId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "model" ALTER COLUMN "attributes" SET NOT NULL;