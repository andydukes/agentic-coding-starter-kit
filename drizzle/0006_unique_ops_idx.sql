-- Ensure unique operations per endpoint definition by (endpointDefinitionId, httpMethod, pathTemplate)
CREATE UNIQUE INDEX IF NOT EXISTS "endpoint_operations_unique_idx"
  ON "endpoint_operations" ("endpointDefinitionId", "httpMethod", "pathTemplate");
