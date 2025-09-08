import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create profile-pics bucket
    const { data: profileBucket, error: profileError } = await supabase.storage.createBucket('profile-pics', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    });

    console.log('Profile bucket result:', { profileBucket, profileError });

    // Create event-pics bucket
    const { data: eventBucket, error: eventError } = await supabase.storage.createBucket('event-pics', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760 // 10MB
    });

    console.log('Event bucket result:', { eventBucket, eventError });

    // List existing buckets to verify
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    console.log('Existing buckets:', buckets);

    return NextResponse.json({
      success: true,
      buckets: buckets,
      profileBucketCreated: !profileError,
      eventBucketCreated: !eventError,
      errors: {
        profile: profileError?.message,
        event: eventError?.message,
        list: listError?.message
      }
    });

  } catch (error: any) {
    console.error('Storage setup error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 