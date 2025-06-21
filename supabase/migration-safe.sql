-- Safe migration that handles existing objects

-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Report',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT FALSE
);

-- Create blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'table', 'chart', 'embed', 'image', 'metric')),
  position INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (will do nothing if already enabled)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;
DROP POLICY IF EXISTS "Users can view blocks in accessible reports" ON blocks;
DROP POLICY IF EXISTS "Users can manage blocks in their reports" ON blocks;

-- Create fresh policies
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = created_by OR is_public = true);

CREATE POLICY "Users can create their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view blocks in accessible reports" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = blocks.report_id 
      AND (reports.created_by = auth.uid() OR reports.is_public = true)
    )
  );

CREATE POLICY "Users can manage blocks in their reports" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = blocks.report_id 
      AND reports.created_by = auth.uid()
    )
  );

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS blocks_report_id_idx ON blocks(report_id);
CREATE INDEX IF NOT EXISTS blocks_position_idx ON blocks(position);
CREATE INDEX IF NOT EXISTS reports_created_by_idx ON reports(created_by);