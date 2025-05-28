import { useEffect, useRef } from "react";
import { announceToScreenReader, trapFocus } from "@/utils/accessibility";

// Custom hook for managing focus trapping in modals/dialogs
export const useFocusTrap = (isOpen: boolean) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen && ref.current) {
      const cleanup = trapFocus(ref.current);
      return cleanup;
    }
  }, [isOpen]);

  return ref;
};

// Custom hook for screen reader announcements
export const useAnnouncement = () => {
  const announce = (message: string) => {
    announceToScreenReader(message);
  };

  return { announce };
};

// Custom hook for managing skip links
export const useSkipLinks = () => {
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded z-50';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, []);
};