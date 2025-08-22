import { pgTable, text, timestamp, boolean, jsonb, integer, numeric } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// UP2TOM models owned by a user
export const model = pgTable("model", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // New fields to align with UP2TOM model schema
  type: text("type").notNull(),
  modelId: text("modelId").notNull(),
  attributes: jsonb("attributes").notNull(),
  // Legacy fields retained temporarily for migration/backfill
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const endpointDefinitions = pgTable("endpoint_definitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  provider: text("provider").notNull(), // e.g., "openai", "http"
  baseUrlTemplate: text("baseUrlTemplate"),
  authRef: text("authRef"), // reference/alias to secret manager
  defaultHeaders: jsonb("defaultHeaders"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Endpoint operations (paths/methods/options) under a definition
export const endpointOperations = pgTable("endpoint_operations", {
  id: text("id").primaryKey(),
  endpointDefinitionId: text("endpointDefinitionId")
    .notNull()
    .references(() => endpointDefinitions.id, { onDelete: "cascade" }),
  operationName: text("operationName").notNull(),
  httpMethod: text("httpMethod").notNull(), // GET|POST|...
  pathTemplate: text("pathTemplate").notNull(),
  requestSchema: jsonb("requestSchema"),
  querySchema: jsonb("querySchema"),
  responseSchema: jsonb("responseSchema"),
  // Optional extraction rules to derive scalar from object responses
  responseExtractPath: text("responseExtractPath"), // JSON Pointer or JSONPath
  responseExtractFormat: text("responseExtractFormat"), // e.g., "number", "string"
  options: jsonb("options"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Attribute definitions normalized per model (immutable by contract)
export const attributeDefinitions = pgTable("attribute_definitions", {
  id: text("id").primaryKey(),
  modelId: text("modelId")
    .notNull()
    .references(() => model.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  question: text("question").notNull(),
  type: text("type").notNull(), // e.g., "Continuous", "Nominal"
  domain: jsonb("domain").notNull(), // DomainC/DomainR
  extraFields: jsonb("extraFields"),
  endpointDefinitionId: text("endpointDefinitionId").references(
    () => endpointDefinitions.id,
    { onDelete: "set null" }
  ),
  operationId: text("operationId").references(() => endpointOperations.id, {
    onDelete: "set null",
  }),
  execBaseUrl: text("execBaseUrl"),
  execPathParams: jsonb("execPathParams"),
  execQueryParams: jsonb("execQueryParams"),
  // Last value tracking (scalar/object + provenance)
  lastValueNumber: numeric("lastValueNumber"),
  lastValueText: text("lastValueText"),
  lastValueObject: jsonb("lastValueObject"),
  lastValueUpdatedAt: timestamp("lastValueUpdatedAt"),
  lastValueSource: text("lastValueSource"), // endpoint|webhook|manual
  // lastResponseId kept as plain text to avoid circular type reference at compile time
  lastResponseId: text("lastResponseId"),
  lastValueMeta: jsonb("lastValueMeta"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Responses log for endpoint invocations
export const responses = pgTable("responses", {
  id: text("id").primaryKey(),
  attributeDefinitionId: text("attributeDefinitionId")
    .notNull()
    .references(() => attributeDefinitions.id, { onDelete: "cascade" }),
  endpointDefinitionId: text("endpointDefinitionId").references(
    () => endpointDefinitions.id,
    { onDelete: "set null" }
  ),
  operationId: text("operationId").references(() => endpointOperations.id, {
    onDelete: "set null",
  }),
  requestUrl: text("requestUrl"),
  requestHeaders: jsonb("requestHeaders"),
  requestQuery: jsonb("requestQuery"),
  requestBody: jsonb("requestBody"),
  responseStatus: integer("responseStatus"),
  responseHeaders: jsonb("responseHeaders"),
  responseBody: jsonb("responseBody"),
  error: jsonb("error"),
  latencyMs: integer("latencyMs"),
  tokensIn: integer("tokensIn"),
  tokensOut: integer("tokensOut"),
  cost: numeric("cost"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
