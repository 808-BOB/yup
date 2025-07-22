require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedRSVPs() {
  try {
    console.log('Seeding RSVPs...');

    // Get real user IDs from the database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    const sampleUserIds = users?.map(user => user.id) || [];
    console.log(`Using ${sampleUserIds.length} real user IDs for RSVPs`);

    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, slug')
      .limit(10); // Focus on first 10 events

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }

    console.log(`Found ${events?.length || 0} events to seed RSVPs for`);

    const responseTypes = ['yup', 'nope', 'maybe'];

    let totalRSVPsCreated = 0;

    for (const event of events || []) {
      console.log(`Seeding RSVPs for event: ${event.title} (ID: ${event.id})`);
      
      // Create 3-8 RSVPs per event
      const numRSVPs = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < numRSVPs; i++) {
        const userId = sampleUserIds[Math.floor(Math.random() * sampleUserIds.length)];
        const responseType = responseTypes[Math.floor(Math.random() * responseTypes.length)];
        
        const { error: rsvpError } = await supabase
          .from('responses')
          .insert({
            event_id: event.id,
            user_id: userId,
            response_type: responseType,
            created_at: new Date().toISOString()
          });

        if (rsvpError) {
          console.error(`Error creating RSVP for event ${event.id}:`, rsvpError);
        } else {
          totalRSVPsCreated++;
        }
      }
    }

    console.log(`Successfully created ${totalRSVPsCreated} RSVPs`);

    // Verify the RSVPs were created
    const { data: allRSVPs, error: verifyError } = await supabase
      .from('responses')
      .select('event_id, response_type, user_id');

    if (verifyError) {
      console.error('Error verifying RSVPs:', verifyError);
    } else {
      console.log(`Total RSVPs in database: ${allRSVPs?.length || 0}`);
      
      // Show breakdown by response type
      const yupCount = allRSVPs?.filter(r => r.response_type === 'yup').length || 0;
      const nopeCount = allRSVPs?.filter(r => r.response_type === 'nope').length || 0;
      const maybeCount = allRSVPs?.filter(r => r.response_type === 'maybe').length || 0;
      
      console.log(`Response breakdown: Yup: ${yupCount}, Nope: ${nopeCount}, Maybe: ${maybeCount}`);
    }

  } catch (error) {
    console.error('Error seeding RSVPs:', error);
  }
}

seedRSVPs(); 