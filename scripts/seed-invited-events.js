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

// Sample users to create (who will host events)
const sampleUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'alice@example.com',
    display_name: 'Alice Johnson',
    profile_image_url: null,
    logo_url: null,
    brand_primary_color: '#FF6B6B',
    brand_secondary_color: '#4ECDC4',
    brand_tertiary_color: '#45B7D1',
    custom_yup_text: 'Going!',
    custom_nope_text: 'Can\'t make it',
    custom_maybe_text: 'Maybe',
    is_premium: true,
    is_pro: false
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'bob@example.com',
    display_name: 'Bob Smith',
    profile_image_url: null,
    logo_url: null,
    brand_primary_color: '#A8E6CF',
    brand_secondary_color: '#DCEDC8',
    brand_tertiary_color: '#FFD3B6',
    custom_yup_text: 'Count me in!',
    custom_nope_text: 'Sorry, busy',
    custom_maybe_text: 'I\'ll try',
    is_premium: false,
    is_pro: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'carol@example.com',
    display_name: 'Carol Davis',
    profile_image_url: null,
    logo_url: null,
    brand_primary_color: '#FF8A80',
    brand_secondary_color: '#FFCC02',
    brand_tertiary_color: '#FF5722',
    custom_yup_text: 'Absolutely!',
    custom_nope_text: 'Not this time',
    custom_maybe_text: 'We\'ll see',
    is_premium: true,
    is_pro: false
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'dave@example.com',
    display_name: 'Dave Wilson',
    profile_image_url: null,
    logo_url: null,
    brand_primary_color: '#9C27B0',
    brand_secondary_color: '#E1BEE7',
    brand_tertiary_color: '#CE93D8',
    custom_yup_text: 'I\'m in!',
    custom_nope_text: 'Can\'t attend',
    custom_maybe_text: 'Might make it',
    is_premium: false,
    is_pro: false
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'eve@example.com',
    display_name: 'Eve Brown',
    profile_image_url: null,
    logo_url: null,
    brand_primary_color: '#4CAF50',
    brand_secondary_color: '#81C784',
    brand_tertiary_color: '#66BB6A',
    custom_yup_text: 'Definitely!',
    custom_nope_text: 'Wish I could',
    custom_maybe_text: 'I\'ll try my best',
    is_premium: true,
    is_pro: false
  }
];

// Sample invited events (hosted by other users)
const invitedEvents = [
  {
    title: "Design Conference 2024",
    slug: "design-conference-2024",
    date: "2024-12-18",
    location: "Miami, FL",
    start_time: "09:00",
    end_time: "18:00",
    description: "Annual design conference with industry leaders and workshops",
    host_id: null, // Will be set to first user
    created_at: new Date().toISOString()
  },
  {
    title: "Holiday Dinner Party",
    slug: "holiday-dinner-2024",
    date: "2024-12-24",
    location: "Chicago, IL",
    start_time: "18:00",
    end_time: "22:00",
    description: "Traditional holiday dinner with family and close friends",
    host_id: null, // Will be set to second user
    created_at: new Date().toISOString()
  },
  {
    title: "Startup Networking Mixer",
    slug: "startup-networking-2024",
    date: "2024-12-28",
    location: "Seattle, WA",
    start_time: "17:00",
    end_time: "20:00",
    description: "Connect with fellow entrepreneurs and potential investors",
    host_id: null, // Will be set to third user
    created_at: new Date().toISOString()
  },
  {
    title: "Art Gallery Opening Night",
    slug: "art-gallery-opening",
    date: "2025-01-10",
    location: "Portland, OR",
    start_time: "19:00",
    end_time: "22:00",
    description: "Opening night for local artists' exhibition with wine and cheese",
    host_id: null, // Will be set to fourth user
    created_at: new Date().toISOString()
  },
  {
    title: "Charity Fundraiser Gala",
    slug: "charity-fundraiser-2025",
    date: "2025-01-20",
    location: "Denver, CO",
    start_time: "18:30",
    end_time: "21:30",
    description: "Annual charity fundraiser for local causes with silent auction",
    host_id: null, // Will be set to fifth user
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
    console.log('Adding sample responses...');
    const sampleResponses = [
      { event_id: createdEvents[0].id, response_type: 'yup', user_id: '11111111-1111-1111-1111-111111111111' },
      { event_id: createdEvents[0].id, response_type: 'yup', user_id: '22222222-2222-2222-2222-222222222222' },
      { event_id: createdEvents[1].id, response_type: 'nope', user_id: '11111111-1111-1111-1111-111111111111' },
      { event_id: createdEvents[2].id, response_type: 'maybe', user_id: '11111111-1111-1111-1111-111111111111' },
      { event_id: createdEvents[3].id, response_type: 'yup', user_id: '33333333-3333-3333-3333-333333333333' },
      { event_id: createdEvents[4].id, response_type: 'nope', user_id: '44444444-4444-4444-4444-444444444444' }
    ];

    const responsesWithGuestCount = sampleResponses.map(response => ({
      ...response,
      guest_count: 1
    }));

    const { data: createdResponses, error: responsesError } = await supabase
      .from('responses')
      .insert(responsesWithGuestCount)
      .select('event_id, response_type');

    if (responsesError) {
      console.error('Error creating responses:', responsesError);
      return;
    }

    console.log('Successfully created responses:', createdResponses.length);

    console.log('Invited events seeding completed!');
    console.log('- Created events: 5');
    console.log('- Created responses: 6 (to simulate different scenarios)');

  } catch (error) {
    console.error('Error seeding invited events:', error);
  }
}

// Run the seeding function
seedInvitedEvents(); 