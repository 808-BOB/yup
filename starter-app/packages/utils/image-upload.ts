import { supabase } from "../../apps/web/lib/supabase";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload profile picture to Supabase Storage
 */
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    // Delete existing profile picture if it exists
    await supabase.storage
      .from('profile-pics')
      .remove([filePath]);

    // Upload new profile picture
    const { error: uploadError } = await supabase.storage
      .from('profile-pics')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-pics')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload profile picture'
    };
  }
}

/**
 * Upload event image to Supabase Storage
 */
export async function uploadEventImage(
  eventId: string,
  file: File
): Promise<UploadResult> {
  try {
    console.log('Starting event image upload for event:', eventId);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Validate file size (max 10MB for event images)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('Uploading to path:', filePath);

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication check failed:', authError);
      return { 
        success: false, 
        error: 'Authentication required for image upload. Please log in and try again.' 
      };
    }

    console.log('User authenticated:', user.id);

    // Delete existing event image if it exists
    console.log('Removing existing image if present...');
    await supabase.storage
      .from('event-pics')
      .remove([filePath]);

    // Upload new event image
    console.log('Uploading new image...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-pics')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      
      // Provide more specific error messages for common issues
      if (uploadError.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Storage permissions error. Please ensure you are logged in and try again.'
        };
      }
      
      if (uploadError.message?.includes('bucket')) {
        return {
          success: false,
          error: 'Storage bucket configuration error. Please contact support.'
        };
      }
      
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-pics')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
  } catch (error: any) {
    console.error('Event image upload error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to upload event image';
    
    if (error.message?.includes('row-level security')) {
      errorMessage = 'Storage access denied. Please ensure you are logged in.';
    } else if (error.message?.includes('unauthorized')) {
      errorMessage = 'Authentication required. Please log in and try again.';
    } else if (error.message?.includes('bucket')) {
      errorMessage = 'Storage configuration error. Please contact support.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Delete profile picture from Supabase Storage
 */
export async function deleteProfilePicture(userId: string): Promise<UploadResult> {
  try {
    // Try to delete with common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    for (const ext of extensions) {
      const filePath = `${userId}.${ext}`;
      await supabase.storage
        .from('profile-pics')
        .remove([filePath]);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Profile picture deletion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete profile picture'
    };
  }
}

/**
 * Delete event image from Supabase Storage
 */
export async function deleteEventImage(eventId: string): Promise<UploadResult> {
  try {
    // Try to delete with common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    for (const ext of extensions) {
      const filePath = `${eventId}.${ext}`;
      await supabase.storage
        .from('event-pics')
        .remove([filePath]);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Event image deletion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete event image'
    };
  }
} 