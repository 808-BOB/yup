// Core type definitions for Yup.RSVP starter-app
export interface User {
  id: string;
  username: string;
  password?: string;
  display_name: string;
  email?: string;
  phone_number?: string;
  reset_token?: string;
  reset_token_expiry?: Date;
  profile_image_url?: string;
  is_admin: boolean;
  is_pro: boolean;
  is_premium: boolean;
  brand_theme?: string;
  logo_url?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  linkedin_id?: string;
  linkedin_access_token?: string;
  linkedin_profile_url?: string;
  linkedin_connections?: string;
}

export interface Event {
  id: number;
  image_url?: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address?: string;
  description?: string;
  host_id: string;
  status: string;
  created_at: Date;
  slug: string;
  allow_guest_rsvp: boolean;
  allow_plus_one: boolean;
  max_guests_per_rsvp: number;
  capacity?: number;
  use_custom_rsvp_text: boolean;
  custom_yup_text?: string;
  custom_nope_text?: string;
  custom_maybe_text?: string;
  rsvp_visibility: string;
  waitlist_enabled: boolean;
}

export interface Response {
  id: number;
  event_id: number;
  user_id?: string;
  response_type: 'yup' | 'nope' | 'maybe';
  created_at: Date;
  is_guest?: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_count?: number;
}

export interface Invitation {
  id: number;
  event_id: number;
  user_id: string;
  status: string;
  created_at: Date;
}

export type EventStatus = 'open' | 'closed' | 'cancelled';
export type ResponseType = 'yup' | 'nope' | 'maybe';
export type RSVPVisibility = 'public' | 'private' | 'host_only'; 