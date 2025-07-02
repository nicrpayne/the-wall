-- This migration was causing conflicts with existing storage setup
-- Reverting to avoid issues since the images bucket already exists
-- from the original migration 20240322000006_setup_storage.sql

-- No changes needed - bucket already exists and is working
