require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample events data
const sampleEvents = [
  // Hosting Events (5) - Recent and upcoming
  {
    title: "Tech Meetup 2024",
    slug: "tech-meetup-2024",
    date: "2024-12-15",
    location: "San Francisco, CA",
    start_time: "18:00",
    end_time: "21:00",
    description: "Join us for an evening of networking and tech talks",
    host_id: "bob-user-id", // Will be replaced with actual user ID
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Birthday Party",
    slug: "birthday-party-2024",
    date: "2024-12-20",
    location: "Los Angeles, CA",
    start_time: "19:00",
    end_time: "23:00",
    description: "Celebrating my 30th birthday with friends and family",
    host_id: "bob-user-id",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Team Building Workshop",
    slug: "team-building-workshop",
    date: "2024-12-25",
    location: "Remote",
    start_time: "14:00",
    end_time: "17:00",
    description: "Virtual team building activities and games",
    host_id: "bob-user-id",
    image_url: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "New Year's Eve Party",
    slug: "new-years-eve-2024",
    date: "2024-12-31",
    location: "New York, NY",
    start_time: "20:00",
    end_time: "02:00",
    description: "Ring in the new year with style",
    host_id: "bob-user-id",
    image_url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Product Launch Event",
    slug: "product-launch-2025",
    date: "2025-01-15",
    location: "Austin, TX",
    start_time: "16:00",
    end_time: "19:00",
    description: "Launching our new product with demos and Q&A",
    host_id: "bob-user-id",
    image_url: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },

  // Invited Events (5) - Events hosted by others
  {
    title: "Design Conference",
    slug: "design-conference-2024",
    date: "2024-12-18",
    location: "Miami, FL",
    start_time: "09:00",
    end_time: "18:00",
    description: "Annual design conference with industry leaders",
    host_id: "other-user-1",
    image_url: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Holiday Dinner",
    slug: "holiday-dinner-2024",
    date: "2024-12-24",
    location: "Chicago, IL",
    start_time: "18:00",
    end_time: "22:00",
    description: "Traditional holiday dinner with family",
    host_id: "other-user-2",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Startup Networking",
    slug: "startup-networking-2024",
    date: "2024-12-28",
    location: "Seattle, WA",
    start_time: "17:00",
    end_time: "20:00",
    description: "Connect with fellow entrepreneurs and investors",
    host_id: "other-user-3",
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Art Gallery Opening",
    slug: "art-gallery-opening",
    date: "2025-01-10",
    location: "Portland, OR",
    start_time: "19:00",
    end_time: "22:00",
    description: "Opening night for local artists' exhibition",
    host_id: "other-user-4",
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },
  {
    title: "Charity Fundraiser",
    slug: "charity-fundraiser-2025",
    date: "2025-01-20",
    location: "Denver, CO",
    start_time: "18:30",
    end_time: "21:30",
    description: "Annual charity fundraiser for local causes",
    host_id: "other-user-5",
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    created_at: new Date().toISOString()
  },

  // Archived Events (5) - Past events
  {
    title: "Summer BBQ 2024",
    slug: "summer-bbq-2024",
    date: "2024-07-15",
    location: "Backyard, CA",
    start_time: "16:00",
    end_time: "22:00",
    description: "Annual summer barbecue with friends",
    host_id: "bob-user-id",
    created_at: "2024-06-01T10:00:00Z"
  },
  {
    title: "Company Retreat",
    slug: "company-retreat-2024",
    date: "2024-09-20",
    location: "Lake Tahoe, CA",
    start_time: "08:00",
    end_time: "18:00",
    description: "Annual company retreat with team building activities",
    host_id: "bob-user-id",
    created_at: "2024-08-01T10:00:00Z"
  },
  {
    title: "Halloween Party",
    slug: "halloween-party-2024",
    date: "2024-10-31",
    location: "Downtown, CA",
    start_time: "20:00",
    end_time: "02:00",
    description: "Spooky Halloween celebration",
    host_id: "bob-user-id",
    created_at: "2024-09-15T10:00:00Z"
  },
  {
    title: "Thanksgiving Dinner",
    slug: "thanksgiving-dinner-2024",
    date: "2024-11-28",
    location: "Family Home, CA",
    start_time: "15:00",
    end_time: "21:00",
    description: "Traditional Thanksgiving dinner with family",
    host_id: "bob-user-id",
    created_at: "2024-10-15T10:00:00Z"
  },
  {
    title: "Holiday Office Party",
    slug: "holiday-office-party-2024",
    date: "2024-12-10",
    location: "Office, CA",
    start_time: "17:00",
    end_time: "22:00",
    description: "Annual holiday office party and gift exchange",
    host_id: "bob-user-id",
    created_at: "2024-11-01T10:00:00Z"
  }
];

async function seedSampleEvents() {
  try {
    console.log('Starting to seed sample events...');

    // Use the existing user ID for bob@bobdavison.com
    const bobUserId = 'f4f17e48-7956-4769-81a6-95e1c95a4166';
    console.log('Using existing user ID:', bobUserId);

    // Create/fetch other users for invited events
    const otherUserEmails = [
      'other1@example.com',
      'other2@example.com',
      'other3@example.com',
      'other4@example.com',
      'other5@example.com',
    ];
    const otherUserIds = {};
    for (let i = 0; i < otherUserEmails.length; i++) {
      const email = otherUserEmails[i];
      let { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      if (!user) {
        // Create user if not exists
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ email })
          .select('id')
          .single();
        if (createError) throw createError;
        user = newUser;
      }
      otherUserIds[`other-user-${i+1}`] = user.id;
    }

    // Insert bob's events (hosting and archived)
    const eventsToInsert = sampleEvents
      .filter(event => event.host_id === 'bob-user-id')
      .map(event => ({
        ...event,
        host_id: bobUserId
      }));

    const { data: insertedEvents, error: insertError } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select('id, title, host_id');

    if (insertError) {
      console.error('Error inserting events:', insertError);
      return;
    }

    // Insert invited events (hosted by others)
    const invitedEventsToInsert = sampleEvents
      .filter(event => event.host_id.startsWith('other-user-'))
      .map(event => ({
        ...event,
        host_id: otherUserIds[event.host_id]
      }));

    const { data: invitedEvents, error: invitedInsertError } = await supabase
      .from('events')
      .insert(invitedEventsToInsert)
      .select('id, slug');

    if (invitedInsertError) {
      console.error('Error inserting invited events:', invitedInsertError);
      return;
    }

    // Create invitations for bob for each invited event
    for (const event of invitedEvents) {
      await supabase.from('invitations').insert({
        event_id: event.id,
        recipient_email: 'bob@bobdavidson.com',
        invitation_method: 'email',
        status: 'sent',
      });
    }

    console.log('Successfully inserted events:', insertedEvents.length);
    console.log('Successfully inserted invited events:', invitedEvents.length);
    console.log('Created invitations for bob for each invited event.');
    console.log('Sample events seeding completed!');
    console.log('- Hosting events: 5');
    console.log('- Invited events: 5');
    console.log('- Archived events: 5');

  } catch (error) {
    console.error('Error seeding sample events:', error);
  }
}

// Run the seeding function
seedSampleEvents(); 