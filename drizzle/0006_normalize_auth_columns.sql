-- Rename existing columns to snake_case if they exist
DO $$
BEGIN
  -- Check if old authRef column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'endpoint_definitions' AND column_name = 'authRef') THEN
    EXECUTE 'ALTER TABLE endpoint_definitions RENAME COLUMN "authRef" TO auth_ref';
  END IF;
  
  -- Check if old authConfig column exists (though it shouldn't exist yet)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'endpoint_definitions' AND column_name = 'authConfig') THEN
    EXECUTE 'ALTER TABLE endpoint_definitions RENAME COLUMN "authConfig" TO auth_config';
  END IF;
  
  -- Ensure auth_type column exists with the correct type and default
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'endpoint_definitions' AND column_name = 'auth_type') THEN
    EXECUTE 'ALTER TABLE endpoint_definitions ADD COLUMN auth_type TEXT NOT NULL DEFAULT ''NONE''';
  END IF;
  
  -- Add auth_config if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'endpoint_definitions' AND column_name = 'auth_config') THEN
    EXECUTE 'ALTER TABLE endpoint_definitions ADD COLUMN auth_config JSONB';
  END IF;
  
  -- Add auth_ref if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'endpoint_definitions' AND column_name = 'auth_ref') THEN
    EXECUTE 'ALTER TABLE endpoint_definitions ADD COLUMN auth_ref TEXT';
  END IF;
  
  -- Add constraint for auth_type
  EXECUTE 'ALTER TABLE endpoint_definitions 
           ADD CONSTRAINT check_auth_type 
           CHECK (auth_type IN (''NONE'', ''BASIC'', ''BEARER'', ''API_KEY''))';
  
  -- Add comments for documentation
  EXECUTE 'COMMENT ON COLUMN endpoint_definitions.auth_type IS ''Type of authentication required (NONE, BASIC, BEARER, API_KEY)''';
  EXECUTE 'COMMENT ON COLUMN endpoint_definitions.auth_config IS ''Configuration for authentication (key names, locations, etc.)''';
  EXECUTE 'COMMENT ON COLUMN endpoint_definitions.auth_ref IS ''Reference to secure credential storage''';
  
  -- Add index on auth_ref for lookups
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_endpoint_definitions_auth_ref ON endpoint_definitions(auth_ref)';
  
  -- Update existing data if needed (migrate from old columns if they exist)
  -- This would be specific to your existing data model
  -- Example: UPDATE endpoint_definitions SET auth_type = 'API_KEY' WHERE auth_ref IS NOT NULL;
END $$;
