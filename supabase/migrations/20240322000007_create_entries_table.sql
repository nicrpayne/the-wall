CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_id UUID NOT NULL REFERENCES walls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_wall_id ON entries(wall_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);

alter publication supabase_realtime add table entries;
