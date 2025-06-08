-- YUP.RSVP Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (id, username, password, display_name, is_admin, is_premium, is_pro, brand_theme) VALUES
('subourbon-admin', 'subourbon', 'events', 'Subourbon Admin', TRUE, TRUE, FALSE, '#84793d'),
('bob-premium', 'bob', 'events', 'Bob Premium', FALSE, TRUE, TRUE, '{"primary":"#11d5ee","background":"hsl(222, 84%, 5%)"}')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  is_admin = EXCLUDED.is_admin,
  is_premium = EXCLUDED.is_premium,
  is_pro = EXCLUDED.is_pro,
  brand_theme = EXCLUDED.brand_theme;

-- Insert sample events
INSERT INTO events (title, description, date, start_time, end_time, location, address, host_id, slug) VALUES
('Subourbon Launch Event', 'Join us for the official launch of our premium event platform', '2025-06-15', '18:00', '22:00', 'The Grand Ballroom', '123 Main Street, Downtown', 'subourbon-admin', 'subourbon-launch-2025'),
('Summer of Bob', 'Photography workshop and networking event', '2025-07-15', '14:00', '18:00', 'Central Park', 'Central Park, New York, NY', 'bob-premium', 'summer-of-bob-2025')
ON CONFLICT (slug) DO NOTHING;

-- Set permissions for authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on responses" ON responses FOR ALL USING (true);
CREATE POLICY "Allow all operations on invitations" ON invitations FOR ALL USING (true);