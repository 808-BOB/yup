import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a person's initials from their name
 * @param name Full name
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format a date string (YYYY-MM-DD) to a more readable format
 * @param dateString ISO date string YYYY-MM-DD
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a time string (HH:MM) to a more readable format
 * @param timeString Time string in 24-hour format (HH:MM)
 * @returns Formatted time string (e.g., "3:30 PM")
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  // Split the time string into hours and minutes
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Determine if it's AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  const hour12 = hours % 12 || 12;
  
  // Format the time
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Truncate a string if it exceeds a certain length
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}