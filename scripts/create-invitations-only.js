const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createInvitations() {
  try {
    console.log('Creating invitations for existing events...');

    // Get bob's user ID
    const { data: bobUser, error: bobError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'bob@bobdavidson.com')
      .single();

    if (bobError) {
      console.error('Error finding bob user:', bobError);
      return;
    }

    console.log('Found bob user ID:', bobUser.id);

    // Get the events we created
    const eventSlugs = [
      'alice-summer-bbq-party',
      'charlie-tech-meetup-2025',
      'diana-wine-tasting-evening',
      'edward-board-game-night'
    ];

    for (const slug of eventSlugs) {
      // Get the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .single();

      if (eventError) {
        console.error(`Error finding event ${slug}:`, eventError);
        continue;
      }

      // Check if invitation already exists
      const { data: existingInvite, error: checkError } = await supabase
        .from('invitations')
        .select('id')
        .eq('event_id', event.id)
        .eq('recipient_email', 'bob@bobdavidson.com')
        .single();

      if (existingInvite) {
        console.log(`Invitation already exists for ${slug}`);
        continue;
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          event_id: event.id,
          invited_by: bobUser.id,
          recipient_email: 'bob@bobdavidson.com',
          invitation_method: 'email',
          status: 'sent',
          created_at: new Date().toISOString()
        });

      if (inviteError) {
        console.error(`Error creating invitation for ${slug}:`, inviteError);
      } else {
        console.log(`Created invitation for: ${slug}`);
      }
    }

    console.log('✅ Invitations created successfully!');
  } catch (error) {
    console.error('Error creating invitations:', error);
  }
}

createInvitations(); 