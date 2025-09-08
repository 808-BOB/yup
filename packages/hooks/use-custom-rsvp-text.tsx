import { useBranding } from "../contexts/BrandingContext";

export interface RSVPTextOptions {
  yup: string;
  nope: string;
  maybe: string;
}

/**
 * Hook to get custom RSVP text for events
 * Falls back to default text if no custom text is set
 */
export function useCustomRSVPText(eventCustomText?: {
  custom_yup_text?: string;
  custom_nope_text?: string;
  custom_maybe_text?: string;
}): RSVPTextOptions {
  const branding = useBranding();

  // Priority: Event-specific custom text > User's global custom text > Default text
  return {
    yup: eventCustomText?.custom_yup_text || branding.customRSVPText.yup || 'Yup',
    nope: eventCustomText?.custom_nope_text || branding.customRSVPText.nope || 'Nope',
    maybe: eventCustomText?.custom_maybe_text || branding.customRSVPText.maybe || 'Maybe'
  };
}

/**
 * Utility function to get custom RSVP text without hooks (for server-side or static contexts)
 */
export function getCustomRSVPText(
  userCustomText?: {
    custom_yup_text?: string;
    custom_nope_text?: string;
    custom_maybe_text?: string;
  },
  eventCustomText?: {
    custom_yup_text?: string;
    custom_nope_text?: string;
    custom_maybe_text?: string;
  }
): RSVPTextOptions {
  return {
    yup: eventCustomText?.custom_yup_text || userCustomText?.custom_yup_text || 'Yup',
    nope: eventCustomText?.custom_nope_text || userCustomText?.custom_nope_text || 'Nope',
    maybe: eventCustomText?.custom_maybe_text || userCustomText?.custom_maybe_text || 'Maybe'
  };
}
