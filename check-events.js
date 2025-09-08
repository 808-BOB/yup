require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvents() {
  try {
    console.log('Checking events in database...');

    // Get all events
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, slug, host_id, date, location');

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    console.log('Total events found:', events?.length || 0);
    
    if (events && events.length > 0) {
      console.log('\nEvents:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. ID: ${event.id}, Title: ${event.title}, Slug: ${event.slug}, Host: ${event.host_id}, Date: ${event.date}, Location: ${event.location}`);
      });
    }

    // Check for bob's events specifically
    const bobUserId = 'f4f17e48-7956-4769-81a6-95e1c95a4166';
    const { data: bobEvents, error: bobError } = await supabase
      .from('events')
      .select('id, title, slug, date, location')
      .eq('host_id', bobUserId);

    if (bobError) {
      console.error('Error fetching bob events:', bobError);
    } else {
      console.log(`\nBob's events (host_id: ${bobUserId}):`, bobEvents?.length || 0);
      if (bobEvents && bobEvents.length > 0) {
        bobEvents.forEach((event, index) => {
          console.log(`${index + 1}. Title: ${event.title}, Slug: ${event.slug}, Date: ${event.date}, Location: ${event.location}`);
        });
      }
    }

  } catch (error) {
    console.error('Error checking events:', error);
  }
}

checkEvents(); 