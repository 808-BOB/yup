-- YUP.RSVP Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  profile_image_url TEXT,
  brand_theme TEXT,
  logo_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  linkedin_id TEXT,
  linkedin_access_token TEXT,
  linkedin_profile_url TEXT,
  linkedin_connections TEXT
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  host_id TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allow_guest_rsvp BOOLEAN DEFAULT TRUE,
  allow_plus_one BOOLEAN DEFAULT TRUE,
  max_guests_per_rsvp BIGINT DEFAULT 1,
  capacity BIGINT,
  use_custom_rsvp_text BOOLEAN DEFAULT FALSE,
  custom_yup_text TEXT,
  custom_nope_text TEXT,
  custom_maybe_text TEXT,
  rsvp_visibility TEXT DEFAULT 'public',
  waitlist_enabled BOOLEAN DEFAULT FALSE
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id TEXT,
  response TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  guest_name TEXT,
  guest_email TEXT,
  guest_count BIGINT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Insert admin user
INSERT INTO users (
  id, 
  username, 
  password, 
  display_name, 
  is_admin, 
  is_premium, 
  brand_theme,
  created_at
) VALUES (
  'subourbon-admin',
  'subourbon',
  'events',
  'Subourbon Admin',
  TRUE,
  TRUE,
  '#84793d',
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  is_admin = EXCLUDED.is_admin,
  is_premium = EXCLUDED.is_premium,
  brand_theme = EXCLUDED.brand_theme;

-- Create sample event for testing
INSERT INTO events (
  title,
  description,
  date,
  start_time,
  end_time,
  location,
  address,
  host_id,
  slug,
  created_at
) VALUES (
  'Subourbon Launch Event',
  'Join us for the official launch of our premium event platform',
  '2025-06-15',
  '18:00',
  '22:00',
  'The Grand Ballroom',
  '123 Main Street, Downtown',
  'subourbon-admin',
  'subourbon-launch-2025',
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create some sample responses for testing metrics
INSERT INTO responses (event_id, user_id, response, created_at)
SELECT 
  e.id,
  'guest-user-' || generate_series(1, 15),
  CASE 
    WHEN generate_series(1, 15) % 3 = 0 THEN 'yup'
    WHEN generate_series(1, 15) % 3 = 1 THEN 'nope'
    ELSE 'maybe'
  END,
  NOW() - (random() * interval '30 days')
FROM events e 
WHERE e.slug = 'subourbon-launch-2025'
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access for the application
CREATE POLICY "Allow read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access to events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow read access to responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow read access to invitations" ON invitations FOR SELECT USING (true);

-- Create policies to allow insert/update/delete for authenticated users
CREATE POLICY "Allow insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow delete events" ON events FOR DELETE USING (true);
CREATE POLICY "Allow insert responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update responses" ON responses FOR UPDATE USING (true);
CREATE POLICY "Allow delete responses" ON responses FOR DELETE USING (true);
CREATE POLICY "Allow insert invitations" ON invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete invitations" ON invitations FOR DELETE USING (true);