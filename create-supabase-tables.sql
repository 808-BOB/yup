-- Complete YUP.RSVP Database Schema
-- Copy and paste this entire SQL into your Supabase SQL Editor and run it

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
  host_id TEXT NOT NULL REFERENCES users(id),
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
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  response TEXT NOT NULL CHECK (response IN ('yup', 'nope', 'maybe')),
  is_guest BOOLEAN DEFAULT FALSE,
  guest_name TEXT,
  guest_email TEXT,
  guest_count BIGINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Insert sample users
INSERT INTO users (id, username, password, display_name, is_admin, is_premium, brand_theme) VALUES
('subourbon-admin', 'subourbon', 'events', 'Subourbon Admin', TRUE, TRUE, '#84793d'),
('bob-premium', 'bob', 'events', 'Bob Premium', FALSE, TRUE, '{"primary":"#11d5ee","background":"hsl(222, 84%, 5%)"}')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  is_admin = EXCLUDED.is_admin,
  is_premium = EXCLUDED.is_premium,
  brand_theme = EXCLUDED.brand_theme;

-- Insert sample event
INSERT INTO events (title, description, date, start_time, end_time, location, address, host_id, slug) VALUES
('Subourbon Launch Event', 'Join us for the official launch of our premium event platform', '2025-06-15', '18:00', '22:00', 'The Grand Ballroom', '123 Main Street, Downtown', 'subourbon-admin', 'subourbon-launch-2025')
ON CONFLICT (slug) DO NOTHING;

-- Create your Summer of Bob event
INSERT INTO events (title, description, date, start_time, end_time, location, address, host_id, slug) VALUES
('Summer of Bob', 'Photography workshop and networking event', '2025-07-15', '14:00', '18:00', 'Central Park', 'Central Park, New York, NY', 'bob-premium', 'summer-of-bob-2025')
ON CONFLICT (slug) DO NOTHING;

-- Create sample responses for metrics
INSERT INTO responses (event_id, user_id, response) 
SELECT e.id, 'guest-user-' || gs, 
  CASE WHEN gs % 3 = 0 THEN 'yup' WHEN gs % 3 = 1 THEN 'nope' ELSE 'maybe' END
FROM events e, generate_series(1, 15) gs 
WHERE e.slug = 'subourbon-launch-2025'
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;