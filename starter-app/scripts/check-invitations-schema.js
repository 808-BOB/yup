const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitationsSchema() {
  try {
    console.log('Checking invitations table schema...');

    // Try to get a sample record to see the structure
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying invitations:', error);
    } else {
      console.log('Invitations table structure:', data);
    }

    // Also try to get the table info
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'invitations' });

    if (tableError) {
      console.log('Could not get table info via RPC, trying direct query...');
      
      // Try a simple insert to see what columns are expected
      const { error: insertError } = await supabase
        .from('invitations')
        .insert({
          event_id: 1,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.log('Insert error shows expected columns:', insertError);
      }
    } else {
      console.log('Table info:', tableInfo);
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkInvitationsSchema(); 