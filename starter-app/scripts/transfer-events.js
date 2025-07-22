require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function transferEvents() {
  try {
    console.log('Starting event transfer...');

    // Get the current user's email from command line argument
    const currentUserEmail = process.argv[2];
    if (!currentUserEmail) {
      console.error('Please provide the current user email as an argument');
      console.error('Usage: node scripts/transfer-events.js your-email@example.com');
      process.exit(1);
    }

    // Get current user ID
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', currentUserEmail)
      .single();

    if (currentUserError || !currentUser) {
      console.error('Current user not found:', currentUserError);
      process.exit(1);
    }

    console.log('Current user:', currentUser.email, 'ID:', currentUser.id);

    // Get bob's user ID
    const bobUserId = 'f4f17e48-7956-4769-81a6-95e1c95a4166';

    // Get all events owned by bob
    const { data: bobEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', bobUserId);

    if (eventsError) {
      console.error('Error fetching bob\'s events:', eventsError);
      process.exit(1);
    }

    console.log(`Found ${bobEvents.length} events to transfer`);

    // Transfer each event to the current user
    for (const event of bobEvents) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ host_id: currentUser.id })
        .eq('id', event.id);

      if (updateError) {
        console.error(`Error transferring event ${event.title}:`, updateError);
      } else {
        console.log(`✓ Transferred: ${event.title}`);
      }
    }

    console.log('Event transfer completed!');
    console.log(`Transferred ${bobEvents.length} events to ${currentUser.email}`);

  } catch (error) {
    console.error('Error in transfer script:', error);
  }
}

transferEvents(); 