
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="sticky bottom-0 py-4 px-6 border-t border-gray-800 bg-background">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
        <p>YUP.RSVP - Simple Event RSVPs</p>
        <p>© {currentYear} - Imagined, Designed, and Developed by Former Colleagues</p>
      </div>
    </footer>
  );
}
