-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create walls table
CREATE TABLE walls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shareable_link TEXT NOT NULL,
  wall_code TEXT NOT NULL UNIQUE,
  is_private BOOLEAN DEFAULT FALSE
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wall_id UUID REFERENCES walls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_wall_id ON submissions(wall_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_walls_wall_code ON walls(wall_code);

-- Enable Row Level Security (RLS)
ALTER TABLE walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for admin auth)
CREATE POLICY "Allow public read access to walls" ON walls
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to approved submissions" ON submissions
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow public insert to submissions" ON submissions
  FOR INSERT WITH CHECK (true);

-- Admin policies (you'll need to implement proper auth)
CREATE POLICY "Allow admin full access to walls" ON walls
  FOR ALL USING (true); -- Replace with proper admin check

CREATE POLICY "Allow admin full access to submissions" ON submissions
  FOR ALL USING (true); -- Replace with proper admin check

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create storage policy
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');
