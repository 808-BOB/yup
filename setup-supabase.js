import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_API_KEY);

async function setupSupabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Test connection first
    const { data: authTest } = await supabase.auth.getSession();
    console.log('✓ Supabase connection established');

    // Try to query users table to see if it exists
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (usersError && usersError.code === 'PGRST116') {
      console.log('Tables do not exist. Please create them manually in Supabase dashboard.');
      console.log('\nGo to your Supabase project dashboard > SQL Editor and run:');
      console.log('\nCREATE TABLE users (\n  id TEXT PRIMARY KEY,\n  username TEXT UNIQUE NOT NULL,\n  password TEXT,\n  display_name TEXT NOT NULL,\n  is_admin BOOLEAN DEFAULT FALSE,\n  is_premium BOOLEAN DEFAULT FALSE,\n  brand_theme TEXT\n);');
      console.log('\nCREATE TABLE events (\n  id BIGSERIAL PRIMARY KEY,\n  title TEXT NOT NULL,\n  description TEXT,\n  date TEXT NOT NULL,\n  start_time TEXT NOT NULL,\n  end_time TEXT NOT NULL,\n  location TEXT NOT NULL,\n  host_id TEXT NOT NULL,\n  slug TEXT UNIQUE NOT NULL\n);');
      return;
    }

    // If tables exist, insert sample data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          id: 'bob-premium',
          username: 'bob',
          password: 'events',
          display_name: 'Bob Premium',
          is_admin: false,
          is_premium: true,
          brand_theme: '{"primary":"#11d5ee","background":"hsl(222, 84%, 5%)"}'
        },
        {
          id: 'subourbon-admin',
          username: 'subourbon',
          password: 'events',
          display_name: 'Subourbon Admin',
          is_admin: true,
          is_premium: true,
          brand_theme: '#84793d'
        }
      ], { onConflict: 'username' });

    if (userError) {
      console.log('User insert error:', userError.message);
    } else {
      console.log('✓ Users created');
    }

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .upsert([
        {
          title: 'Summer of Bob',
          description: 'Photography workshop and networking event',
          date: '2025-07-15',
          start_time: '14:00',
          end_time: '18:00',
          location: 'Central Park',
          host_id: 'bob-premium',
          slug: 'summer-of-bob-2025'
        }
      ], { onConflict: 'slug' });

    if (eventError) {
      console.log('Event insert error:', eventError.message);
    } else {
      console.log('✓ Summer of Bob event created');
    }

    // Verify setup
    const { data: users } = await supabase.from('users').select('username, display_name');
    const { data: events } = await supabase.from('events').select('title');
    
    console.log('\nSetup complete!');
    console.log('Users:', users?.map(u => u.username).join(', '));
    console.log('Events:', events?.map(e => e.title).join(', '));

  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

setupSupabase();