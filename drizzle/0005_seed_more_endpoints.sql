-- Seed additional mock endpoint definitions and multiple operations for each
-- This migration is idempotent via ON CONFLICT DO NOTHING

-- Endpoint Definitions
INSERT INTO "endpoint_definitions" ("id", "name", "provider", "baseUrlTemplate", "authRef") VALUES
  ('11111111-1111-1111-1111-111111111111', 'OpenAI API', 'openai', 'https://api.openai.com/v1', 'OPENAI_API_KEY'),
  ('22222222-2222-2222-2222-222222222222', 'GitHub REST', 'github', 'https://api.github.com', 'GITHUB_TOKEN'),
  ('33333333-3333-3333-3333-333333333333', 'HTTPBin', 'http', 'https://httpbin.org', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Operations for OpenAI API
INSERT INTO "endpoint_operations" (
  "id", "endpointDefinitionId", "operationName", "httpMethod", "pathTemplate", "options"
) VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'List Models', 'GET', '/models', NULL),
  ('11111111-bbbb-1111-bbbb-111111111111', '11111111-1111-1111-1111-111111111111', 'Retrieve Model', 'GET', '/models/{model}', NULL),
  ('11111111-cccc-1111-cccc-111111111111', '11111111-1111-1111-1111-111111111111', 'Create Chat Completion', 'POST', '/chat/completions', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Operations for GitHub REST
INSERT INTO "endpoint_operations" (
  "id", "endpointDefinitionId", "operationName", "httpMethod", "pathTemplate", "options"
) VALUES
  ('22222222-aaaa-2222-aaaa-222222222222', '22222222-2222-2222-2222-222222222222', 'List Repos', 'GET', '/users/{username}/repos', NULL),
  ('22222222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'Get Repo', 'GET', '/repos/{owner}/{repo}', NULL),
  ('22222222-cccc-2222-cccc-222222222222', '22222222-2222-2222-2222-222222222222', 'Create Issue', 'POST', '/repos/{owner}/{repo}/issues', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Operations for HTTPBin (useful for testing)
INSERT INTO "endpoint_operations" (
  "id", "endpointDefinitionId", "operationName", "httpMethod", "pathTemplate", "options"
) VALUES
  ('33333333-aaaa-3333-aaaa-333333333333', '33333333-3333-3333-3333-333333333333', 'Echo GET', 'GET', '/get', NULL),
  ('33333333-bbbb-3333-bbbb-333333333333', '33333333-3333-3333-3333-333333333333', 'Echo POST', 'POST', '/post', NULL),
  ('33333333-cccc-3333-cccc-333333333333', '33333333-3333-3333-3333-333333333333', 'Status 418', 'GET', '/status/418', NULL)
ON CONFLICT ("id") DO NOTHING;
