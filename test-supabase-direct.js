import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndSetupDatabase() {
  console.log('Testing Supabase connection and database setup...');
  
  try {
    // Test if users table exists
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError && usersError.message.includes('does not exist')) {
      console.log('Database tables do not exist. Creating them now...');
      
      // Create tables using SQL
      const createTablesSQL = `
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
      `;

      // Execute table creation
      const { error: createError } = await supabase.rpc('exec', { sql: createTablesSQL });
      
      if (createError) {
        console.log('Table creation failed:', createError.message);
        console.log('Please run the SQL script manually in your Supabase dashboard.');
        return;
      }
      
      console.log('Tables created successfully');
    } else {
      console.log('Tables already exist');
    }

    // Create admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .upsert({
        id: 'subourbon-admin',
        username: 'subourbon',
        password: 'events',
        display_name: 'Subourbon Admin',
        is_admin: true,
        is_premium: true,
        brand_theme: '#84793d'
      }, {
        onConflict: 'username'
      })
      .select();

    if (adminError) {
      console.log('Admin user creation error:', adminError.message);
    } else {
      console.log('Admin user created/updated successfully');
    }

    // Create sample event if none exists
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (!eventsError && existingEvents && existingEvents.length === 0) {
      const { data: sampleEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: 'Subourbon Launch Event',
          description: 'Join us for the official launch of our premium event platform',
          date: '2025-06-15',
          start_time: '18:00',
          end_time: '22:00',
          location: 'The Grand Ballroom',
          address: '123 Main Street, Downtown',
          host_id: 'subourbon-admin',
          slug: 'subourbon-launch-2025'
        })
        .select();

      if (!eventError && sampleEvent) {
        console.log('Sample event created');
        
        // Add sample responses
        const responses = [];
        for (let i = 1; i <= 15; i++) {
          responses.push({
            event_id: sampleEvent[0].id,
            user_id: `guest-user-${i}`,
            response: i % 3 === 0 ? 'yup' : i % 3 === 1 ? 'nope' : 'maybe'
          });
        }
        
        const { error: responsesError } = await supabase
          .from('responses')
          .insert(responses);
          
        if (!responsesError) {
          console.log('Sample responses created');
        }
      }
    }

    // Test final connection
    const { data: finalTest, error: finalError } = await supabase
      .from('users')
      .select('username')
      .eq('username', 'subourbon')
      .single();

    if (finalError) {
      console.log('Final test failed:', finalError.message);
    } else {
      console.log('Database setup complete. Admin user verified:', finalTest.username);
    }

  } catch (error) {
    console.error('Setup failed:', error.message);
  }
}

testAndSetupDatabase();