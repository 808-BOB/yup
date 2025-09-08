import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up brand-logos storage bucket...');

    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration. Service role key required for bucket creation.',
        details: 'SUPABASE_SERVICE_ROLE_KEY environment variable is required'
      }, { status: 500 });
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json({
        error: 'Failed to check existing buckets',
        details: listError.message
      }, { status: 500 });
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.id === 'brand-logos');
    console.log('Bucket exists:', bucketExists);

    if (!bucketExists) {
      // Create the bucket with proper configuration
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('brand-logos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json({
          error: 'Failed to create brand-logos bucket',
          details: createError.message,
          suggestion: 'Try creating the bucket manually in the Supabase Dashboard under Storage'
        }, { status: 500 });
      }

      console.log('Bucket created successfully:', createData);
    }

    // Test upload to verify permissions work
    const testFileName = `test/${Date.now()}-test.txt`;
    const testContent = new Blob(['test upload'], { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('brand-logos')
      .upload(testFileName, testContent, { upsert: true });

    if (uploadError) {
      console.error('Test upload failed:', uploadError);
      return NextResponse.json({
        error: 'Bucket exists but upload is not working',
        details: uploadError.message,
        bucketExists: true,
        uploadWorking: false,
        suggestion: 'Check bucket permissions in Supabase Dashboard'
      }, { status: 500 });
    }

    // Clean up test file
    await supabaseAdmin.storage
      .from('brand-logos')
      .remove([testFileName]);

    // Get bucket info for verification
    const { data: bucketInfo } = await supabaseAdmin.storage.getBucket('brand-logos');

    return NextResponse.json({
      success: true,
      message: 'brand-logos bucket is properly configured and working',
      bucketExists: true,
      uploadWorking: true,
      bucketInfo: bucketInfo
    });

  } catch (error: any) {
    console.error('Storage setup error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      suggestion: 'Check server logs for more details'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use regular client for read-only operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check bucket status
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        details: listError.message
      }, { status: 500 });
    }

    const brandLogoBucket = buckets?.find(bucket => bucket.id === 'brand-logos');

    return NextResponse.json({
      bucketExists: !!brandLogoBucket,
      bucketInfo: brandLogoBucket,
      allBuckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
      instructions: brandLogoBucket ? null : {
        message: "Bucket not found. You can create it by:",
        options: [
          "1. POST to this endpoint to create automatically (requires SUPABASE_SERVICE_ROLE_KEY)",
          "2. Create manually in Supabase Dashboard > Storage > Create bucket",
          "3. Run the setup-brand-logos-bucket.sql script"
        ]
      }
    });

  } catch (error: any) {
    console.error('Storage check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
