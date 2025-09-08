"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <p>
              Yup.RSVP is committed to protecting your privacy. We collect and use your personal information solely for the purpose of providing our event management and RSVP services.
            </p>
            <ul className="list-disc ml-6 text-gray-300 text-sm">
              <li>We <strong>do not sell or share</strong> your phone number or personal data with third parties, except as necessary to provide our services (such as sending SMS or email invitations).</li>
              <li>We store your phone number, email, and RSVP data securely and use it only for event-related communications.</li>
              <li>You may request deletion of your data at any time by contacting <a href="mailto:support@yuprsvp.com" className="text-blue-400 hover:text-blue-300 underline">support@yuprsvp.com</a>.</li>
              <li>We comply with all applicable privacy laws and SMS regulations, including TCPA and CTIA guidelines.</li>
            </ul>
            <p>
              For more details on how we use your data, please review our <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</a>.
            </p>
            <p>
              If you have any questions or concerns about your privacy, please contact us at <a href="mailto:support@yuprsvp.com" className="text-blue-400 hover:text-blue-300 underline">support@yuprsvp.com</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 