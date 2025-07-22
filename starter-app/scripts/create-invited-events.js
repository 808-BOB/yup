const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createInvitedEvents() {
  try {
    console.log('Creating invited events...');

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

    // Create events hosted by bob but with different titles to simulate different hosts
    const events = [
      {
        title: "Alice's Summer BBQ Party",
        slug: "alice-summer-bbq-party",
        date: "2025-07-15",
        start_time: "18:00:00",
        end_time: "22:00:00",
        location: "Central Park",
        address: "123 Park Avenue, New York, NY",
        description: "Join Alice for a fun summer BBQ with great food and company!",
        host_id: bobUser.id, // bob hosts but it's "Alice's" event
        allow_guest_rsvp: true,
        allow_plus_one: true,
        max_guests_per_rsvp: 2,
        public_rsvp_enabled: true,
        rsvp_visibility: 'public',
        waitlist_enabled: false
      },
      {
        title: "Charlie's Tech Meetup 2025",
        slug: "charlie-tech-meetup-2025",
        date: "2025-08-20",
        start_time: "19:00:00",
        end_time: "21:00:00",
        location: "Innovation Hub",
        address: "456 Tech Street, San Francisco, CA",
        description: "Monthly tech meetup with Charlie - networking and presentations",
        host_id: bobUser.id, // bob hosts but it's "Charlie's" event
        allow_guest_rsvp: false,
        allow_plus_one: true,
        max_guests_per_rsvp: 1,
        public_rsvp_enabled: false,
        rsvp_visibility: 'private',
        waitlist_enabled: true
      },
      {
        title: "Diana's Wine Tasting Evening",
        slug: "diana-wine-tasting-evening",
        date: "2025-09-10",
        start_time: "20:00:00",
        end_time: "23:00:00",
        location: "Vintage Cellars",
        address: "789 Wine Road, Napa Valley, CA",
        description: "Exclusive wine tasting with Diana - sommelier-led experience",
        host_id: bobUser.id, // bob hosts but it's "Diana's" event
        allow_guest_rsvp: true,
        allow_plus_one: false,
        max_guests_per_rsvp: 1,
        public_rsvp_enabled: true,
        rsvp_visibility: 'public',
        waitlist_enabled: false
      },
      {
        title: "Edward's Board Game Night",
        slug: "edward-board-game-night",
        date: "2025-10-05",
        start_time: "18:30:00",
        end_time: "22:30:00",
        location: "Game Haven",
        address: "321 Game Street, Seattle, WA",
        description: "Strategic board games with Edward - casual fun for everyone",
        host_id: bobUser.id, // bob hosts but it's "Edward's" event
        allow_guest_rsvp: true,
        allow_plus_one: true,
        max_guests_per_rsvp: 3,
        public_rsvp_enabled: true,
        rsvp_visibility: 'public',
        waitlist_enabled: false
      }
    ];

    // Create the events
    for (const event of events) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          ...event,
          created_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (eventError) {
        console.error(`Error creating event ${event.title}:`, eventError);
      } else {
        console.log(`Created event: ${event.title}`);
        
        // Create invitation for bob@bobdavidson.com to simulate being invited
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert({
            event_id: eventData.id,
            user_id: bobUser.id, // bob is invited to his own events (for testing)
            status: 'pending',
            created_at: new Date().toISOString()
          });

        if (inviteError) {
          console.error(`Error creating invitation for ${event.title}:`, inviteError);
        } else {
          console.log(`Created invitation for: ${event.title}`);
        }
      }
    }

    console.log('✅ Invited events created successfully!');
  } catch (error) {
    console.error('Error creating invited events:', error);
  }
}

createInvitedEvents(); 