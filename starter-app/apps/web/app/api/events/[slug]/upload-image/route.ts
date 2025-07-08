import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug: eventSlugOrId } = params;
    
    if (!eventSlugOrId) {
      return NextResponse.json({ error: 'Event slug/ID is required' }, { status: 400 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Initialize Supabase with service role key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the event to find its actual ID (in case slug was provided)
    const { data: eventData, error: lookupError } = await supabase
      .from('events')
      .select('id')
      .or(`slug.eq.${eventSlugOrId},id.eq.${eventSlugOrId}`)
      .single();

    if (lookupError || !eventData) {
      console.error('Event lookup error:', lookupError);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventId = eventData.id;

    // Create file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}.${fileExt}`;
    const filePath = fileName;

    console.log('Server-side upload - Event ID:', eventId);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    console.log('Upload path:', filePath);

    // Remove existing file if it exists
    await supabase.storage
      .from('event-pics')
      .remove([filePath]);

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-pics')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Server upload error:', uploadError);
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-pics')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;
    console.log('Generated public URL:', imageUrl);

    // Update event with image URL
    const { data: updatedEventData, error: updateError } = await supabase
      .from('events')
      .update({ image_url: imageUrl })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ 
        error: `Failed to update event: ${updateError.message}` 
      }, { status: 500 });
    }

    console.log('Event updated successfully with image URL');

    return NextResponse.json({
      success: true,
      url: imageUrl,
      event: updatedEventData
    });

  } catch (error: any) {
    console.error('Server-side upload error:', error);
    return NextResponse.json({
      error: `Server error: ${error.message}`
    }, { status: 500 });
  }
} 