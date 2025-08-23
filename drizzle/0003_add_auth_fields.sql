-- Add auth columns to endpoint_definitions
ALTER TABLE endpoint_definitions 
  ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'NONE' CHECK (auth_type IN ('NONE', 'BASIC', 'BEARER', 'API_KEY')),
  ADD COLUMN auth_config JSONB,
  ADD COLUMN auth_ref TEXT;

-- Add comment for documentation
COMMENT ON COLUMN endpoint_definitions.auth_type IS 'Type of authentication required (NONE, BASIC, BEARER, API_KEY)';
COMMENT ON COLUMN endpoint_definitions.auth_config IS 'Configuration for authentication (key names, locations, etc.)';
COMMENT ON COLUMN endpoint_definitions.auth_ref IS 'Reference to secure credential storage';

-- Update existing records if needed
-- For example, if you have existing API key endpoints, you might do:
-- UPDATE endpoint_definitions 
-- SET auth_type = 'API_KEY', 
--     auth_config = '{"keyName": "api-key", "keyLocation": "header"}'
-- WHERE provider = 'some_provider';

-- Add an index on auth_ref since we'll be looking up credentials by this field
CREATE INDEX IF NOT EXISTS idx_endpoint_definitions_auth_ref ON endpoint_definitions(auth_ref);
