import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST endpoint to handle logo uploads
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Logo upload endpoint called for user:', params.id);

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'No authorization header provided'
      }, { status: 401 });
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

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed',
        message: authError?.message || 'User not authenticated'
      }, { status: 401 });
    }

    // Check if user is trying to update their own logo
    if (user.id !== params.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You can only update your own branding'
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large',
        message: 'Please select an image smaller than 5MB'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: 'Please select a JPEG, PNG, WebP, or SVG image'
      }, { status: 400 });
    }

    console.log('File validation passed:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${user.id}/logo-${timestamp}.${fileExt}`;

    console.log('Uploading to path:', fileName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // Handle specific error cases
      if (uploadError.message?.includes('new row violates row-level security policy')) {
        return NextResponse.json({
          error: 'Permission denied',
          message: 'You may not have upload permissions. Please contact support.',
          code: 'RLS_VIOLATION'
        }, { status: 403 });
      } else if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json({
          error: 'Storage not configured',
          message: 'The storage bucket is not properly configured. Please contact support.',
          code: 'BUCKET_NOT_FOUND'
        }, { status: 500 });
      } else {
        return NextResponse.json({
          error: 'Upload failed',
          message: uploadError.message || 'Failed to upload file',
          code: 'UPLOAD_ERROR'
        }, { status: 500 });
      }
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json({
        error: 'URL generation failed',
        message: 'Failed to get public URL for uploaded image'
      }, { status: 500 });
    }

    const publicUrl = urlData.publicUrl;
    console.log('Public URL generated:', publicUrl);

    // Update user's logo_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ logo_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        error: 'Database update failed',
        message: 'Logo uploaded but failed to save URL to database',
        publicUrl // Still return the URL so the frontend can handle it
      }, { status: 500 });
    }

    console.log('Logo upload complete for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: publicUrl,
      upload: uploadData
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve user's current branding
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
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

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed'
      }, { status: 401 });
    }

    // Get user's branding data
    const { data, error } = await supabase
      .from('users')
      .select(`
        logo_url,
        brand_primary_color,
        brand_secondary_color,
        brand_tertiary_color,
        custom_yup_text,
        custom_nope_text,
        custom_maybe_text,
        is_premium
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch branding data',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branding: data
    });

  } catch (error: any) {
    console.error('Branding fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
