/**
 * Formats a date string to a readable format
 * @param dateString A date string in any valid format (ISO, etc.)
 * @returns Formatted date string (e.g., "Monday, January 1, 2023")
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Adjust for timezone by adding the offset
    const tzOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + tzOffset);
    
    return adjustedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if invalid
  }
}

/**
 * Formats a time string to a readable format
 * @param timeString A time string (e.g., "14:30" or ISO datetime)
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(timeString: string | undefined): string {
  if (!timeString) return '';
  
  try {
    // If it's just a time (HH:MM)
    if (timeString.includes(':') && timeString.length <= 8) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    // If it's a full date-time string
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if invalid
  }
}