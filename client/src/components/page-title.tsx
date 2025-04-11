import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
  suffix?: string;
}

/**
 * Component to set the page title dynamically
 */
export default function PageTitle({ title, suffix = 'Yup.RSVP' }: PageTitleProps) {
  useEffect(() => {
    // Update the document title when the component mounts or title changes
    const fullTitle = suffix ? `${title} | ${suffix}` : title;
    document.title = fullTitle;
    
    // Clean up by restoring the default title when the component unmounts
    return () => {
      document.title = 'Yup.RSVP';
    };
  }, [title, suffix]);

  // This component doesn't render anything to the DOM
  return null;
}