"use client";

import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <Image src="/Yup-logo.png" alt="Yup.RSVP Logo" width={120} height={120} className="mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Yup.RSVP</h1>
        <p className="text-lg text-gray-300 mb-4">
          The easiest way to manage events, send invitations, and collect RSVPs via SMS and email. Trusted by event organizers for seamless, compliant guest communication.
        </p>
        <div className="mb-4">
          <a href="mailto:support@yuprsvp.com" className="text-blue-400 hover:text-blue-300 underline">support@yuprsvp.com</a>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a href="/terms" className="text-gray-400 hover:text-white underline">Terms of Service</a>
          <a href="/privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</a>
          <a href="/phone-verification-demo" className="text-gray-400 hover:text-white underline">SMS Opt-In Demo</a>
          <a href="/sms/opt-out" className="text-gray-400 hover:text-white underline">SMS Opt-Out</a>
        </div>
      </div>
    </div>
  );
} 