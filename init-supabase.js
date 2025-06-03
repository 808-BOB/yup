import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDatabase() {
  console.log('Initializing Supabase database...');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    console.log('Connection test:', error ? error.message : 'Success');
    
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