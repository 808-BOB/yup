"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Alert, AlertDescription } from "@/ui/alert";
import Phone from "lucide-react/dist/esm/icons/phone";
import Shield from "lucide-react/dist/esm/icons/shield";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import { Separator } from "@/ui/separator";

export default function PhoneVerificationDemoPage() {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendVerification = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!smsConsent) {
      alert("Please agree to receive SMS messages to continue.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setStep("verify");
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert("Please enter the 6-digit verification code.");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      alert("Demo: Phone number verified and consent recorded!");
      setIsVerifying(false);
      setStep("phone");
      setPhoneNumber("");
      setVerificationCode("");
      setSmsConsent(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-400" /> SMS Opt-In Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === "phone" && (
              <>
                <p className="text-gray-300 text-sm mb-2">
                  Enter your phone number to see how users opt in to receive SMS invitations, confirmations, reminders, and 2-factor codes from Yup.RSVP.
                </p>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="mb-2"
                  maxLength={14}
                />
                <div className="flex items-center mb-2">
                  <Checkbox id="sms-consent" checked={smsConsent} onCheckedChange={v => setSmsConsent(!!v)} />
                  <label htmlFor="sms-consent" className="ml-2 text-gray-300 text-sm">
                    I agree to receive SMS messages for invitations, confirmations, reminders, and 2-factor codes from Yup.RSVP.
                  </label>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Message and data rates may apply. See our <a href="/privacy" className="underline text-blue-400">Privacy Policy</a> and <a href="/terms" className="underline text-blue-400">Terms</a>.
                </div>
                <Button onClick={handleSendVerification} disabled={isLoading} className="w-full">
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            )}
            {step === "verify" && (
              <>
                <p className="text-gray-300 text-sm mb-2">
                  Enter the 6-digit code sent to your phone.
                </p>
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mb-2"
                  maxLength={6}
                />
                <Button onClick={handleVerifyCode} disabled={isVerifying} className="w-full">
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </Button>
              </>
            )}
            <Separator className="my-4" />
            <Alert className="bg-gray-800 border-blue-400">
              <Shield className="w-5 h-5 text-blue-400 mr-2 inline" />
              <AlertDescription>
                <strong>Demo Only:</strong> This page is for demonstration purposes and does not send real SMS messages or store data.
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <a href="/privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</a>
              <a href="/terms" className="text-gray-400 hover:text-white underline">Terms of Service</a>
              <a href="/sms/opt-out" className="text-gray-400 hover:text-white underline">SMS Opt-Out</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 