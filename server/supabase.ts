import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL || '';
const supabaseKey = process.env.SUPABASE_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables using direct SQL
export async function initializeDatabase() {
  console.log('Initializing Supabase database tables...');
  
  try {
    // Create users table
    const usersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT,
        display_name TEXT NOT NULL,
        email TEXT,
        phone_number TEXT,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    `;

    const { error: usersError } = await supabase.rpc('exec_sql', { sql: usersSQL });
    if (usersError) {
      console.error('Error creating users table:', usersError);
    }

    // Create events table
    const eventsSQL = `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        allow_guest_rsvp BOOLEAN DEFAULT TRUE,
        allow_plus_one BOOLEAN DEFAULT TRUE,
        max_guests_per_rsvp INTEGER DEFAULT 1,
        capacity INTEGER,
        FOREIGN KEY (host_id) REFERENCES users(id)
      );
    `;

    const { error: eventsError } = await supabase.rpc('exec_sql', { sql: eventsSQL });
    if (eventsError) {
      console.error('Error creating events table:', eventsError);
    }

    // Create responses table
    const responsesSQL = `
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id TEXT,
        response TEXT NOT NULL,
        is_guest BOOLEAN DEFAULT FALSE,
        guest_name TEXT,
        guest_email TEXT,
        guest_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const { error: responsesError } = await supabase.rpc('exec_sql', { sql: responsesSQL });
    if (responsesError) {
      console.error('Error creating responses table:', responsesError);
    }

    // Create invitations table
    const invitationsSQL = `
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(event_id, user_id)
      );
    `;

    const { error: invitationsError } = await supabase.rpc('exec_sql', { sql: invitationsSQL });
    if (invitationsError) {
      console.error('Error creating invitations table:', invitationsError);
    }

    console.log('Database initialization completed');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Create admin user
export async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: 'subourbon-admin',
        username: 'subourbon',
        password: 'events',
        display_name: 'Subourbon Admin',
        is_admin: true,
        is_premium: true,
        brand_theme: '#84793d',
        logo_url: null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (error) {
      console.error('Error creating admin user:', error);
      return false;
    }

    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return false;
  }
}