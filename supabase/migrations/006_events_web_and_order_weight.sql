-- Migration 006: Add 'web' column to events, add 'weight' to orders, fix schema mismatches

-- Add 'web' column to events (event/external URL, distinct from ticket_url)
ALTER TABLE events ADD COLUMN IF NOT EXISTS web text;

-- Make city optional (default to 'Barcelona')
ALTER TABLE events ALTER COLUMN city DROP NOT NULL;
ALTER TABLE events ALTER COLUMN city SET DEFAULT 'Barcelona';

-- Make start_time optional (default to '20:00')
ALTER TABLE events ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE events ALTER COLUMN start_time SET DEFAULT '20:00';

-- Add weight column to orders (in grams, for shipping calculations)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight integer;

-- Add tracking_url column if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
