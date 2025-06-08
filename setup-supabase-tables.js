import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Setting up Supabase tables...');
  
  try {
    // Create users table first
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.log('Users table creation result:', usersError.message);
    }

    // Insert admin user
    console.log('Creating admin user...');
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
      })
      .select()
      .single();

    if (adminError) {
      console.log('Admin user creation error:', adminError.message);
    } else {
      console.log('Admin user created:', adminUser?.username);
    }

    // Insert bob user
    console.log('Creating bob user...');
    const { data: bobUser, error: bobError } = await supabase
      .from('users')
      .upsert({
        id: 'bob-premium',
        username: 'bob',
        password: 'events',
        display_name: 'Bob Premium',
        is_admin: false,
        is_pro: true,
        is_premium: true,
        brand_theme: '{"primary":"#11d5ee","background":"hsl(222, 84%, 5%)"}'
      })
      .select()
      .single();

    if (bobError) {
      console.log('Bob user creation error:', bobError.message);
    } else {
      console.log('Bob user created:', bobUser?.username);
    }

    // Create sample event
    console.log('Creating sample event...');
    const { data: event, error: eventError } = await supabase
      .from('events')
      .upsert({
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
      .select()
      .single();

    if (eventError) {
      console.log('Event creation error:', eventError.message);
    } else {
      console.log('Sample event created:', event?.title);
    }

    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupTables();