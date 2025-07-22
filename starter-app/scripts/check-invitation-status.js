const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitationStatus() {
  try {
    console.log('Checking invitation status values...');

    // Try different status values
    const statusValues = ['sent', 'received', 'viewed', 'responded', 'confirmed', 'declined', 'maybe'];

    for (const status of statusValues) {
      console.log(`Trying status: ${status}`);
      
      const { error } = await supabase
        .from('invitations')
        .insert({
          event_id: 1,
          invited_by: 'f4f17e48-7956-4769-81a6-95e1c95a4166',
          invitation_method: 'email',
          status: status,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.log(`Status '${status}' failed:`, error.message);
      } else {
        console.log(`Status '${status}' worked!`);
        // Clean up the test record
        await supabase
          .from('invitations')
          .delete()
          .eq('event_id', 1)
          .eq('invited_by', 'f4f17e48-7956-4769-81a6-95e1c95a4166');
        break;
      }
    }

  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkInvitationStatus(); 