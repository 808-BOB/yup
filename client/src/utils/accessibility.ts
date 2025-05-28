// Accessibility utilities for better screen reader support and keyboard navigation

export const ARIA_LABELS = {
  // Navigation
  mainNavigation: "Main navigation",
  userMenu: "User account menu",
  breadcrumb: "Breadcrumb navigation",
  
  // Forms
  requiredField: "Required field",
  formErrors: "Form validation errors",
  passwordToggle: "Toggle password visibility",
  
  // Events
  eventCard: "Event details",
  rsvpStatus: "RSVP status",
  attendeeCount: "Number of attendees",
  eventActions: "Event actions",
  
  // Interactive elements
  closeDialog: "Close dialog",
  expandDetails: "Expand details",
  sortOptions: "Sort options",
  filterOptions: "Filter options",
  
  // Status indicators
  loading: "Loading content",
  error: "Error message",
  success: "Success message",
  warning: "Warning message",
} as const;

export const ARIA_DESCRIPTIONS = {
  eventDate: "Event date and time",
  eventLocation: "Event location",
  eventDescription: "Event description",
  rsvpDeadline: "RSVP deadline",
  eventCapacity: "Event capacity and current attendance",
  hostInfo: "Event host information",
} as const;

// Keyboard navigation helpers
export const handleKeyDown = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onSpace?: () => void
) => {
  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter();
      }
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      break;
    case ' ':
      if (onSpace) {
        event.preventDefault();
        onSpace();
      }
      break;
  }
};

// Screen reader announcements
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Semantic HTML helpers
export const getButtonProps = (onClick: () => void, ariaLabel?: string) => ({
  type: 'button' as const,
  onClick,
  onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, onClick),
  'aria-label': ariaLabel,
  role: 'button',
  tabIndex: 0,
});

export const getLinkProps = (href: string, ariaLabel?: string) => ({
  href,
  'aria-label': ariaLabel,
  role: 'link',
});