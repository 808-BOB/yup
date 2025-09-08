require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  try {
    console.log('Checking users in database...');

    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, created_at');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log('Total users found:', users?.length || 0);
    
    if (users && users.length > 0) {
      console.log('\nUsers:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers(); 