
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-6 px-4 border-t border-gray-800">
      <div className="max-w-md mx-auto text-center text-sm text-gray-400">
        <p className="mb-2">yup.rsvp - Simple Event RSVPs</p>
        <p>© {currentYear} - Imagined, Designed, and Developed by Former Colleagues</p>
      </div>
    </footer>
  );
}
