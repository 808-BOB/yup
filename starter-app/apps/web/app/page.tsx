"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Blurred background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/@party.jpeg"
          alt="Event background"
          fill
          style={{ objectFit: "cover" }}
          className="blur-lg brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Top-right navigation */}
      <div className="absolute top-0 right-0 p-6 flex gap-4 z-10">
        <Link href="/auth/login">
          <button className="px-5 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 font-semibold transition">Log In</button>
        </Link>
        <Link href="/auth/login"> {/* Update to /auth/signup if you have a separate signup page */}
          <button className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/80 font-semibold transition">Sign Up</button>
        </Link>
      </div>

      {/* Centered main content */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 z-10">
        <Image src="/Yup-logo.png" alt="Yup.RSVP Logo" width={120} height={120} className="mx-auto mb-4" />
        <h1 className="text-5xl font-extrabold mb-4 text-white drop-shadow-lg">Yup.RSVP</h1>
        <p className="text-xl text-gray-200 mb-6 max-w-2xl mx-auto drop-shadow">
          The easiest way to manage events, send invitations, and collect RSVPs via SMS and email.<br />
          Trusted by event organizers for seamless, compliant guest communication.
        </p>
        <a href="mailto:support@yuprsvp.com" className="text-blue-300 hover:text-blue-200 underline mb-8 inline-block">support@yuprsvp.com</a>
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <Link href="/terms" className="text-gray-200 hover:text-white underline">Terms of Service</Link>
          <Link href="/privacy" className="text-gray-200 hover:text-white underline">Privacy Policy</Link>
          <Link href="/phone-verification-demo" className="text-gray-200 hover:text-white underline">SMS Opt-In Demo</Link>
          <Link href="/sms/opt-out" className="text-gray-200 hover:text-white underline">SMS Opt-Out</Link>
        </div>
      </main>
    </div>
  );
} 