import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDatabase() {
  console.log('Initializing Supabase database...');
  
  try {
    // Test if tables exist by trying to read from them
    console.log('Checking existing tables...');
    
    const { data: usersCheck, error: usersCheckError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersCheckError && usersCheckError.message.includes('does not exist')) {
      console.log('Tables need to be created manually in Supabase dashboard');
      console.log('Please create the following tables in your Supabase project:');
      console.log('');
      console.log('1. users table with columns:');
      console.log('   - id (text, primary key)');
      console.log('   - username (text, unique)');
      console.log('   - password (text)');
      console.log('   - display_name (text)');
      console.log('   - email (text)');
      console.log('   - phone_number (text)');
      console.log('   - reset_token (text)');
      console.log('   - reset_token_expiry (timestamp)');
      console.log('   - created_at (timestamp, default now())');
      console.log('   - is_admin (boolean, default false)');
      console.log('   - is_pro (boolean, default false)');
      console.log('   - is_premium (boolean, default false)');
      console.log('   - profile_image_url (text)');
      console.log('   - brand_theme (text)');
      console.log('   - logo_url (text)');
      console.log('   - stripe_customer_id (text)');
      console.log('   - stripe_subscription_id (text)');
      console.log('   - linkedin_id (text)');
      console.log('   - linkedin_access_token (text)');
      console.log('   - linkedin_profile_url (text)');
      console.log('   - linkedin_connections (text)');
      console.log('');
      console.log('2. events table with columns:');
      console.log('   - id (bigint, primary key, auto increment)');
      console.log('   - title (text)');
      console.log('   - description (text)');
      console.log('   - date (text)');
      console.log('   - start_time (text)');
      console.log('   - end_time (text)');
      console.log('   - location (text)');
      console.log('   - address (text)');
      console.log('   - host_id (text)');
      console.log('   - status (text, default "open")');
      console.log('   - slug (text, unique)');
      console.log('   - image_url (text)');
      console.log('   - created_at (timestamp, default now())');
      console.log('   - allow_guest_rsvp (boolean, default true)');
      console.log('   - allow_plus_one (boolean, default true)');
      console.log('   - max_guests_per_rsvp (bigint, default 1)');
      console.log('   - capacity (bigint)');
      console.log('');
      console.log('3. responses table with columns:');
      console.log('   - id (bigint, primary key, auto increment)');
      console.log('   - event_id (bigint)');
      console.log('   - user_id (text)');
      console.log('   - response (text)');
      console.log('   - is_guest (boolean, default false)');
      console.log('   - guest_name (text)');
      console.log('   - guest_email (text)');
      console.log('   - guest_count (bigint, default 1)');
      console.log('   - created_at (timestamp, default now())');
      console.log('');
      console.log('4. invitations table with columns:');
      console.log('   - id (bigint, primary key, auto increment)');
      console.log('   - event_id (bigint)');
      console.log('   - user_id (text)');
      console.log('   - created_at (timestamp, default now())');
      console.log('');
      console.log('After creating tables, run this script again to create the admin user.');
      return;
    } else {
      console.log('Tables already exist');
    }
    
    // Create admin user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: 'subourbon-admin',
        username: 'subourbon',
        password: 'events',
        display_name: 'Subourbon Admin',
        is_admin: true,
        is_premium: true,
        brand_theme: '#84793d',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      })
      .select();

    if (userError) {
      console.log('User creation result:', userError.message);
    } else {
      console.log('Admin user created successfully:', userData);
    }

    // Test login
    const { data: loginData, error: loginError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'subourbon')
      .eq('password', 'events')
      .single();

    if (loginError) {
      console.log('Login test failed:', loginError.message);
    } else {
      console.log('Login test successful:', loginData.username);
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
}

initDatabase();