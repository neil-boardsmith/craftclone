-- Add 'metric' to the allowed block types
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
  CHECK (type IN ('text', 'table', 'chart', 'embed', 'image', 'metric'));