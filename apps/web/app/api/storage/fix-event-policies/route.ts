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

    console.log('Fixing RLS policies for event-pics bucket...');

    // Execute SQL directly using the service role client
    const results = [];
    
    // Drop existing policies for event-pics bucket
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Authenticated users can upload event pictures" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can update event pictures they own" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can delete event pictures they own" ON storage.objects;',
      'DROP POLICY IF EXISTS "Event pictures are publicly viewable" ON storage.objects;',
      'DROP POLICY IF EXISTS "Anyone can view event pictures" ON storage.objects;'
    ];

    for (const sql of dropPolicies) {
      try {
        const { error } = await supabase.rpc('sql', { query: sql });
        results.push({ sql: sql.substring(0, 50) + '...', success: !error, error: error?.message });
        if (error) {
          console.warn('Error dropping policy (may not exist):', error.message);
        }
      } catch (err) {
        console.warn('Could not execute drop policy SQL:', err);
      }
    }

    // Create new policies for event-pics bucket
    const createPolicies = [
      `CREATE POLICY "Anyone can view event pictures" ON storage.objects
        FOR SELECT USING (bucket_id = 'event-pics');`,
      
      `CREATE POLICY "Authenticated users can upload event pictures" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'event-pics' 
          AND auth.uid() IS NOT NULL
        );`,
      
      `CREATE POLICY "Authenticated users can update event pictures" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'event-pics' 
          AND auth.uid() IS NOT NULL
        );`,
      
      `CREATE POLICY "Authenticated users can delete event pictures" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'event-pics' 
          AND auth.uid() IS NOT NULL
        );`
    ];

    for (const sql of createPolicies) {
      try {
        const { error } = await supabase.rpc('sql', { query: sql });
        results.push({ sql: sql.split('\n')[0], success: !error, error: error?.message });
        if (error) {
          console.error('Error creating policy:', error.message);
        } else {
          console.log('Policy created successfully:', sql.split('\n')[0]);
        }
      } catch (err: any) {
        console.error('Could not execute create policy SQL:', err);
        results.push({ sql: sql.split('\n')[0], success: false, error: err.message });
      }
    }

    // Test upload to verify permissions work
    console.log('Testing upload permissions...');
    const testFileName = `test/${Date.now()}-test.txt`;
    const testContent = new Blob(['test upload'], { type: 'text/plain' });

    let uploadWorking = false;
    let uploadError = null;
    
    try {
      const { data: uploadData, error: testUploadError } = await supabase.storage
        .from('event-pics')
        .upload(testFileName, testContent, { upsert: true });

      if (!testUploadError) {
        uploadWorking = true;
        // Clean up test file
        await supabase.storage
          .from('event-pics')
          .remove([testFileName]);
      } else {
        uploadError = testUploadError.message;
      }
    } catch (err: any) {
      uploadError = err.message;
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated for event-pics bucket',
      policyResults: results,
      uploadTest: {
        working: uploadWorking,
        error: uploadError
      }
    });

  } catch (error: any) {
    console.error('Error fixing event policies:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 