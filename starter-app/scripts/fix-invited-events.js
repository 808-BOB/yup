const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixInvitedEvents() {
  try {
    console.log('Fixing invited events with different host IDs...');

    // Create some fake user IDs for different hosts
    const fakeHostIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444'
    ];

    // Get the events we created
    const eventSlugs = [
      'alice-summer-bbq-party',
      'charlie-tech-meetup-2025',
      'diana-wine-tasting-evening',
      'edward-board-game-night'
    ];

    for (let i = 0; i < eventSlugs.length; i++) {
      const slug = eventSlugs[i];
      const fakeHostId = fakeHostIds[i];

      // Update the event to have a different host
      const { error: updateError } = await supabase
        .from('events')
        .update({ host_id: fakeHostId })
        .eq('slug', slug);

      if (updateError) {
        console.error(`Error updating event ${slug}:`, updateError);
      } else {
        console.log(`Updated event ${slug} to have host ID: ${fakeHostId}`);
      }
    }

    console.log('✅ Invited events fixed successfully!');
  } catch (error) {
    console.error('Error fixing invited events:', error);
  }
}

fixInvitedEvents(); 