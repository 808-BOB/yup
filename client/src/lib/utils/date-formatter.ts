export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
}

/**
 * Formats a 24-hour time string (HH:MM) to a 12-hour time string with AM/PM (h:MM AM/PM)
 * @param timeString Time string in 24-hour format (HH:MM)
 * @returns Formatted time string in 12-hour format with AM/PM (h:MM AM/PM)
 */
export function formatTime(timeString: string): string {
  // Return original if not in expected format
  if (!timeString || !timeString.includes(':')) {
    return timeString;
  }

  // Extract hours and minutes
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  
  if (isNaN(hour) || hour < 0 || hour > 23) {
    return timeString;
  }
  
  // Determine if it's AM or PM
  const period = hour >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  const hour12 = hour % 12 || 12; // 0 should be displayed as 12 in 12-hour format
  
  return `${hour12}:${minuteStr} ${period}`;
}
