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

    // Delete existing event image if it exists
    await supabase.storage
      .from('event-pics')
      .remove([filePath]);

    // Upload new event image
    const { error: uploadError } = await supabase.storage
      .from('event-pics')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-pics')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
  } catch (error: any) {
    console.error('Event image upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload event image'
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