"use client";

import Link from "next/link";
import { cn } from "../utils/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn(
      "bg-black border-t border-gray-800 py-6 px-4 mt-auto",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 mb-4">
          <Link 
            href="/" 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Home
          </Link>
          
          <span className="hidden sm:block text-gray-600 mx-4">•</span>
          
          <Link 
            href="/my-events" 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            My Events
          </Link>
          
          <span className="hidden sm:block text-gray-600 mx-4">•</span>
          
          <Link 
            href="/profile" 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            My Account
          </Link>
        </div>
        
        {/* Powered by */}
        <div className="text-center border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500">
            Powered by{" "}
            <Link 
              href="https://yup.rsvp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
            >
              yup.rsvp
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
