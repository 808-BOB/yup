"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col bg-black">
      {/* Top-right navigation */}
      <div className="absolute top-0 right-0 p-6 flex gap-4 z-[100] pointer-events-auto">
        <Link href="/auth/login" className="px-5 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 font-semibold transition">Log In</Link>
        <Link href="/auth/login?mode=signup" className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/80 font-semibold transition">Sign Up</Link>
      </div>

      {/* Centered main content */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <Image src="/Yup-logo.png" alt="Yup.RSVP Logo" width={240} height={240} className="mx-auto mb-12" style={{ width: "auto", height: "auto" }} />
        
        <h1 className="text-5xl font-bold mb-12 text-white font-mono">So, do you party?</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button className="px-8 py-4 rounded-md bg-primary text-white hover:bg-primary/80 font-semibold transition text-lg">
            Yup
          </button>
          <button className="px-8 py-4 rounded-md bg-white/10 text-white hover:bg-white/20 font-semibold transition text-lg">
            Maybe
          </button>
          <button className="px-8 py-4 rounded-md bg-white/10 text-white hover:bg-white/20 font-semibold transition text-lg">
            Nope
          </button>
        </div>

        <button 
          onClick={() => setShowAbout(!showAbout)}
          className="text-gray-300 hover:text-white underline mb-8 text-lg"
        >
          About YUP...
        </button>

        {showAbout && (
          <p className="text-gray-300 mb-8 max-w-md mx-auto text-lg">
            The simplest way to manage who's in and who's out. No ads. Just invites and RSVPs.
          </p>
        )}
      </main>

      {/* Footer positioned at bottom of viewport */}
      <footer className="flex flex-wrap justify-center gap-6 py-6 px-4">
        <Link href="/terms" className="text-gray-200 hover:text-white underline text-sm">Terms of Service</Link>
        <Link href="/privacy" className="text-gray-200 hover:text-white underline text-sm">Privacy Policy</Link>
        <Link href="/phone-verification-demo" className="text-gray-200 hover:text-white underline text-sm">SMS Opt-In Demo</Link>
        <Link href="/sms/opt-out" className="text-gray-200 hover:text-white underline text-sm">SMS Opt-Out</Link>
        <a href="mailto:support@yup.rsvp" className="text-gray-200 hover:text-white underline text-sm">support@yup.rsvp</a>
      </footer>
    </div>
  );
} 