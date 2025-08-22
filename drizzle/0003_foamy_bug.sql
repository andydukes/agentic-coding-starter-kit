CREATE TABLE "attribute_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"modelId" text NOT NULL,
	"name" text NOT NULL,
	"question" text NOT NULL,
	"type" text NOT NULL,
	"domain" jsonb NOT NULL,
	"extraFields" jsonb,
	"endpointDefinitionId" text,
	"operationId" text,
	"execBaseUrl" text,
	"execPathParams" jsonb,
	"execQueryParams" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "endpoint_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"baseUrlTemplate" text,
	"authRef" text,
	"defaultHeaders" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "endpoint_definitions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "endpoint_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"endpointDefinitionId" text NOT NULL,
	"operationName" text NOT NULL,
	"httpMethod" text NOT NULL,
	"pathTemplate" text NOT NULL,
	"requestSchema" jsonb,
	"querySchema" jsonb,
	"responseSchema" jsonb,
	"options" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" text PRIMARY KEY NOT NULL,
	"attributeDefinitionId" text NOT NULL,
	"endpointDefinitionId" text,
	"operationId" text,
	"requestUrl" text,
	"requestHeaders" jsonb,
	"requestQuery" jsonb,
	"requestBody" jsonb,
	"responseStatus" integer,
	"responseHeaders" jsonb,
	"responseBody" jsonb,
	"error" jsonb,
	"latencyMs" integer,
	"tokensIn" integer,
	"tokensOut" integer,
	"cost" numeric,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_modelId_model_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_endpointDefinitionId_endpoint_definitions_id_fk" FOREIGN KEY ("endpointDefinitionId") REFERENCES "public"."endpoint_definitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_operationId_endpoint_operations_id_fk" FOREIGN KEY ("operationId") REFERENCES "public"."endpoint_operations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoint_operations" ADD CONSTRAINT "endpoint_operations_endpointDefinitionId_endpoint_definitions_id_fk" FOREIGN KEY ("endpointDefinitionId") REFERENCES "public"."endpoint_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_attributeDefinitionId_attribute_definitions_id_fk" FOREIGN KEY ("attributeDefinitionId") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_endpointDefinitionId_endpoint_definitions_id_fk" FOREIGN KEY ("endpointDefinitionId") REFERENCES "public"."endpoint_definitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_operationId_endpoint_operations_id_fk" FOREIGN KEY ("operationId") REFERENCES "public"."endpoint_operations"("id") ON DELETE set null ON UPDATE no action;