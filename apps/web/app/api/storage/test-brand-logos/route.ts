import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Initialize Supabase client with the user's session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Test authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authError?.message
      }, { status: 401 });
    }

    // For bucket listing, we need to use service role (admin) client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let buckets = null;
    let bucketError = null;

    if (serviceRoleKey) {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      const result = await adminSupabase.storage.listBuckets();
      buckets = result.data;
      bucketError = result.error;
    } else {
      // Fallback to user client (might not work for listing buckets)
      const result = await supabase.storage.listBuckets();
      buckets = result.data;
      bucketError = result.error;
    }

    if (bucketError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        details: bucketError.message,
        hasServiceRole: !!serviceRoleKey
      }, { status: 500 });
    }

    const brandLogoBucket = buckets?.find(b => b.id === 'brand-logos');
    if (!brandLogoBucket) {
      return NextResponse.json({
        error: 'brand-logos bucket not found',
        availableBuckets: buckets?.map(b => b.id) || [],
        hasServiceRole: !!serviceRoleKey
      }, { status: 404 });
    }

    // Test file listing in the bucket (using user client)
    const { data: files, error: listError } = await supabase.storage
      .from('brand-logos')
      .list('', { limit: 10 });

    if (listError) {
      return NextResponse.json({
        error: 'Failed to list files in brand-logos bucket',
        details: listError.message
      }, { status: 500 });
    }

    // Test upload permissions by trying to upload a tiny test file
    const testFileName = `${user.id}/test-${Date.now()}.png`;

    // Create a tiny 1x1 pixel PNG as a buffer
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);

    const testFile = new File([pngBuffer], 'test.png', { type: 'image/png' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(testFileName, testFile, { upsert: true });

    let uploadResult = null;
    if (uploadError) {
      uploadResult = {
        success: false,
        error: uploadError.message,
        code: uploadError.name || 'unknown'
      };
    } else {
      uploadResult = {
        success: true,
        path: uploadData.path
      };

      // Clean up test file
      await supabase.storage
        .from('brand-logos')
        .remove([testFileName]);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      bucket: {
        id: brandLogoBucket.id,
        name: brandLogoBucket.name,
        public: brandLogoBucket.public,
        fileSizeLimit: brandLogoBucket.file_size_limit,
        allowedMimeTypes: brandLogoBucket.allowed_mime_types
      },
      files: {
        count: files?.length || 0,
        items: files?.slice(0, 5) || []
      },
      uploadTest: uploadResult,
      hasServiceRole: !!serviceRoleKey
    });

  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to test actual file uploads
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authError?.message
      }, { status: 401 });
    }

    // Upload file
    const fileName = `${user.id}/test-upload-${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json({
        error: 'Upload failed',
        details: uploadError.message
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      upload: uploadData,
      publicUrl: urlData.publicUrl
    });

  } catch (error: any) {
    console.error('Upload test error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
