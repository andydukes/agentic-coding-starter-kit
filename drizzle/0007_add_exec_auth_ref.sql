-- Add exec_auth_ref column to attribute_definitions
ALTER TABLE attribute_definitions 
ADD COLUMN exec_auth_ref TEXT 
COMMENT 'Overrides auth_ref from endpoint_definition at execution time';
