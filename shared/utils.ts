/**
 * Generate a username based on email or a default pattern
 * @param email Optional email to generate username from
 * @param uid User ID to use as fallback
 * @returns A generated username
 */
export function generateUsername(email?: string | null, uid?: string): string {
  if (email) {
    // Use the part before @ in the email as username base
    const baseUsername = email.split('@')[0]
      // Remove special characters and replace with underscore
      .replace(/[^a-zA-Z0-9]/g, '_')
      // Ensure no consecutive underscores
      .replace(/_+/g, '_');
    
    // Add random digits to make it more unique
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${baseUsername}_${randomDigits}`;
  } else if (uid) {
    // Use the UID with 'user_' prefix
    return `user_${uid.substring(0, 8)}`;
  } else {
    // Fallback if neither email nor UID is available
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp.substring(timestamp.length - 4)}_${randomStr}`;
  }
}