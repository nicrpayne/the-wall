-- Create walls table
CREATE TABLE IF NOT EXISTS walls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  wall_code TEXT UNIQUE NOT NULL,
  shareable_link TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_id UUID REFERENCES walls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;

-- Enable realtime for submissions
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE walls;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_wall_id ON submissions(wall_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_walls_wall_code ON walls(wall_code);

-- Insert some sample data
INSERT INTO walls (id, title, description, wall_code, shareable_link) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Gratitude Journal', 'Share what you''re grateful for today', 'GRAT01', 'https://jovial-neumann8-xqys4.view-3.tempo-dev.app/wall/550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Daily Reflections', 'End of day thoughts and reflections', 'REFL01', 'https://jovial-neumann8-xqys4.view-3.tempo-dev.app/wall/550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Creative Writing', 'Share your poetry, short stories, or creative writing', 'CREA01', 'https://jovial-neumann8-xqys4.view-3.tempo-dev.app/wall/550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;

-- Insert some sample submissions
INSERT INTO submissions (wall_id, image_url, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1527236438218-d82077ae1f85?w=400&q=80', 'pending'),
  ('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&q=80', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80', 'pending')
ON CONFLICT DO NOTHING;