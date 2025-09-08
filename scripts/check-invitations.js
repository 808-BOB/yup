const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitations() {
  try {
    console.log('Checking invitations in database...');

    // Get all invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*');

    if (error) {
      console.error('Error fetching invitations:', error);
      return;
    }

    console.log('Total invitations found:', invitations?.length || 0);
    
    if (invitations && invitations.length > 0) {
      console.log('Invitations:');
      invitations.forEach((invite, index) => {
        console.log(`${index + 1}. Event ID: ${invite.event_id}, Recipient Email: ${invite.recipient_email}, Status: ${invite.status}`);
      });
    }

    // Check for bob's invitations specifically
    const { data: bobInvitations, error: bobError } = await supabase
      .from('invitations')
      .select('*')
      .eq('recipient_email', 'bob@bobdavidson.com');

    if (bobError) {
      console.error('Error fetching bob invitations:', bobError);
    } else {
      console.log('\nBob\'s invitations:', bobInvitations?.length || 0);
      if (bobInvitations && bobInvitations.length > 0) {
        bobInvitations.forEach((invite, index) => {
          console.log(`${index + 1}. Event ID: ${invite.event_id}, Status: ${invite.status}`);
        });
      }
    }

    // Check the events that should be invited
    const eventSlugs = [
      'alice-summer-bbq-party',
      'charlie-tech-meetup-2025',
      'diana-wine-tasting-evening',
      'edward-board-game-night'
    ];

    console.log('\nChecking events:');
    for (const slug of eventSlugs) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, host_id')
        .eq('slug', slug)
        .single();

      if (eventError) {
        console.log(`Event ${slug}: Not found`);
      } else {
        console.log(`Event ${slug}: ID ${event.id}, Title: ${event.title}, Host: ${event.host_id}`);
      }
    }

  } catch (error) {
    console.error('Error checking invitations:', error);
  }
}

checkInvitations(); 