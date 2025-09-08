"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-link-hover flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">SMS Messaging Terms</CardTitle>
              <CardDescription>
                Important information about SMS communications from YUP.RSVP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">SMS Consent and Opt-in</h3>
                <p className="text-gray-300 text-sm">
                  By providing your phone number and checking the SMS consent box, you expressly consent to receive SMS text messages from YUP.RSVP. 
                  These messages may include account verification codes, event notifications, RSVP reminders, and service updates.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Message Frequency</h3>
                <p className="text-gray-300 text-sm">
                  Message frequency varies depending on your event activity. You may receive messages for:
                </p>
                <ul className="text-gray-300 text-sm mt-2 ml-4 list-disc">
                  <li>Phone number verification (one-time)</li>
                  <li>Event invitations when you're invited</li>
                  <li>RSVP confirmations when you respond</li>
                  <li>Event reminders (if enabled)</li>
                  <li>Account security notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Message and Data Rates</h3>
                <p className="text-gray-300 text-sm">
                  Standard message and data rates may apply. YUP.RSVP does not charge for SMS messages, but your mobile carrier may charge for text messages and data usage.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Opt-out Instructions</h3>
                <p className="text-gray-300 text-sm">
                  You may opt out of receiving SMS messages at any time by:
                </p>
                <ul className="text-gray-300 text-sm mt-2 ml-4 list-disc">
                  <li>Replying <strong>STOP</strong> to any SMS message</li>
                  <li>Visiting <strong>{process.env.NEXT_PUBLIC_SITE_URL}/sms/opt-out</strong></li>
                  <li>Updating your account settings</li>
                </ul>
                <p className="text-gray-300 text-sm mt-2">
                  After opting out, you will receive a confirmation message and no longer receive SMS messages from YUP.RSVP.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Opt-in Instructions</h3>
                <p className="text-gray-300 text-sm">
                  To resubscribe to SMS messages after opting out, reply <strong>START</strong> to any previous message thread or update your account settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Help and Support</h3>
                <p className="text-gray-300 text-sm">
                  For help with SMS messages, reply <strong>HELP</strong> to any message or contact our support team at{" "}
                  <a href="mailto:support@yuprsvp.com" className="text-blue-400 hover:text-blue-300">
                    support@yuprsvp.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">General Terms of Service</CardTitle>
              <CardDescription>
                Terms governing the use of YUP.RSVP services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Acceptance of Terms</h3>
                <p className="text-gray-300 text-sm">
                  By using YUP.RSVP, you agree to be bound by these Terms of Service and our Privacy Policy. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Service Description</h3>
                <p className="text-gray-300 text-sm">
                  YUP.RSVP is an event management and RSVP platform that allows users to create events, send invitations, 
                  and manage responses via SMS and email communications.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">User Responsibilities</h3>
                <ul className="text-gray-300 text-sm ml-4 list-disc">
                  <li>Provide accurate and current information</li>
                  <li>Maintain the security of your account</li>
                  <li>Use the service in compliance with applicable laws</li>
                  <li>Respect other users' privacy and data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Privacy and Data</h3>
                <p className="text-gray-300 text-sm">
                  Your privacy is important to us. Phone numbers and personal information are used solely for 
                  event management and communication purposes. We do not sell or share your data with third parties 
                  except as necessary to provide our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Prohibited Uses</h3>
                <p className="text-gray-300 text-sm">
                  You may not use YUP.RSVP for spam, harassment, illegal activities, or to violate others' rights. 
                  We reserve the right to terminate accounts that violate these terms.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                <p className="text-gray-300 text-sm">
                  YUP.RSVP is provided "as is" without warranties. We are not liable for any damages arising from 
                  the use of our service, including but not limited to communication failures or data loss.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Changes to Terms</h3>
                <p className="text-gray-300 text-sm">
                  We may update these terms from time to time. Users will be notified of significant changes. 
                  Continued use of the service after changes constitutes acceptance of the updated terms.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p className="text-gray-300 text-sm">
                  If you have questions about these terms, please contact us at{" "}
                  <a href="mailto:support@yuprsvp.com" className="text-blue-400 hover:text-blue-300">
                    support@yuprsvp.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Compliance Information</CardTitle>
              <CardDescription>
                Regulatory compliance for SMS messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">TCPA Compliance</h3>
                <p className="text-gray-300 text-sm">
                  YUP.RSVP complies with the Telephone Consumer Protection Act (TCPA) and requires express consent 
                  before sending SMS messages. All messages include opt-out instructions.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">CTIA Guidelines</h3>
                <p className="text-gray-300 text-sm">
                  Our SMS practices follow CTIA (Cellular Telecommunications Industry Association) guidelines for 
                  responsible messaging, including proper consent mechanisms and opt-out procedures.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Carrier Requirements</h3>
                <p className="text-gray-300 text-sm">
                  YUP.RSVP works with mobile carriers to ensure message delivery and compliance with carrier-specific 
                  requirements for business messaging.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 