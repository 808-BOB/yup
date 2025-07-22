require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

// Sample invited events (hosted by bob but with different response scenarios)
const invitedEvents = [
  {
    title: "Design Conference 2024",
    slug: "design-conference-2024-v2",
    date: "2024-12-18",
    location: "Miami, FL",
    start_time: "09:00",
    end_time: "18:00",
    description: "Annual design conference with industry leaders and workshops",
    created_at: new Date().toISOString()
  },
  {
    title: "Holiday Dinner Party",
    slug: "holiday-dinner-2024-v2",
    date: "2024-12-24",
    location: "Chicago, IL",
    start_time: "18:00",
    end_time: "22:00",
    description: "Traditional holiday dinner with family and close friends",
    created_at: new Date().toISOString()
  },
  {
    title: "Startup Networking Mixer",
    slug: "startup-networking-2024-v2",
    date: "2024-12-28",
    location: "Seattle, WA",
    start_time: "17:00",
    end_time: "20:00",
    description: "Connect with fellow entrepreneurs and potential investors",
    created_at: new Date().toISOString()
  },
  {
    title: "Art Gallery Opening Night",
    slug: "art-gallery-opening-v2",
    date: "2025-01-10",
    location: "Portland, OR",
    start_time: "19:00",
    end_time: "22:00",
    description: "Opening night for local artists' exhibition with wine and cheese",
    created_at: new Date().toISOString()
  },
  {
    title: "Charity Fundraiser Gala",
    slug: "charity-fundraiser-2025-v2",
    date: "2025-01-20",
    location: "Denver, CO",
    start_time: "18:30",
    end_time: "21:30",
    description: "Annual charity fundraiser for local causes with silent auction",
    created_at: new Date().toISOString()
  }
];

async function seedInvitedEvents() {
  try {
    console.log('Starting to seed invited events...');

    // Get bob's user ID
    const bobUserId = 'f4f17e48-7956-4769-81a6-95e1c95a4166';
    console.log('Bob\'s user ID:', bobUserId);

    // Create events hosted by bob but with different response scenarios
    console.log('Creating invited events...');
    const eventsToInsert = invitedEvents.map((event, index) => ({
      ...event,
      host_id: bobUserId // Use bob as host for simplicity
    }));

    const { data: createdEvents, error: eventsError } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select('id, title, host_id');

    if (eventsError) {
      console.error('Error creating events:', eventsError);
      return;
    }

    console.log('Successfully created events:', createdEvents.length);

    // Add sample responses for variety to simulate different scenarios
    // We'll use bob's ID for all responses to avoid foreign key issues
    console.log('Adding sample responses...');
    const sampleResponses = [
      // Event 1: Multiple yup responses
      { event_id: createdEvents[0].id, response_type: 'yup', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[0].id, response_type: 'yup', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[0].id, response_type: 'yup', user_id: bobUserId, guest_count: 1 },
      
      // Event 2: Multiple nope responses
      { event_id: createdEvents[1].id, response_type: 'nope', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[1].id, response_type: 'nope', user_id: bobUserId, guest_count: 1 },
      
      // Event 3: Multiple maybe responses
      { event_id: createdEvents[2].id, response_type: 'maybe', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[2].id, response_type: 'maybe', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[2].id, response_type: 'maybe', user_id: bobUserId, guest_count: 1 },
      
      // Event 4: Mixed responses
      { event_id: createdEvents[3].id, response_type: 'yup', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[3].id, response_type: 'nope', user_id: bobUserId, guest_count: 1 },
      
      // Event 5: Mixed responses
      { event_id: createdEvents[4].id, response_type: 'yup', user_id: bobUserId, guest_count: 1 },
      { event_id: createdEvents[4].id, response_type: 'maybe', user_id: bobUserId, guest_count: 1 }
    ];

    const { data: createdResponses, error: responsesError } = await supabase
      .from('responses')
      .insert(sampleResponses)
      .select('event_id, response_type');

    if (responsesError) {
      console.error('Error creating responses:', responsesError);
      return;
    }

    console.log('Successfully created responses:', createdResponses.length);

    console.log('Invited events seeding completed!');
    console.log('- Created events: 5');
    console.log('- Created responses: 11 (to simulate different scenarios)');
    console.log('- Event 1: 3 yup responses (will show in YUP tab)');
    console.log('- Event 2: 2 nope responses (will show in NOPE tab)');
    console.log('- Event 3: 3 maybe responses (will show in MAYBE tab)');
    console.log('- Event 4: 1 yup, 1 nope (will show in YUP and NOPE tabs)');
    console.log('- Event 5: 1 yup, 1 maybe (will show in YUP and MAYBE tabs)');

  } catch (error) {
    console.error('Error seeding invited events:', error);
  }
}

// Run the seeding function
seedInvitedEvents(); 