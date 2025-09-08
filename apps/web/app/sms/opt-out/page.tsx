"use client";

import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Alert, AlertDescription } from "@/ui/alert";
import { useToast } from "@/utils/use-toast";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Phone from "lucide-react/dist/esm/icons/phone";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";

function SMSOptOutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pre-fill phone number from URL params if available
    const phone = searchParams.get("phone");
    if (phone) {
      setPhoneNumber(decodeURIComponent(phone));
    }
  }, [searchParams]);

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

  const getE164Phone = (formattedPhone: string) => {
    const cleaned = formattedPhone.replace(/\D/g, "");
    return `+1${cleaned}`;
  };

  const handleOptOut = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const e164Phone = getE164Phone(phoneNumber);
      
      const response = await fetch("/api/sms/opt-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: e164Phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsOptedOut(true);
        toast({
          title: "Successfully Opted Out",
          description: "You will no longer receive SMS messages from YUP.RSVP.",
        });
      } else {
        throw new Error(data.error || "Failed to opt out");
      }
    } catch (error) {
      console.error("Opt-out error:", error);
      setError(error instanceof Error ? error.message : "Failed to opt out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptIn = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const e164Phone = getE164Phone(phoneNumber);
      
      const response = await fetch("/api/sms/opt-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: e164Phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsOptedOut(false);
        toast({
          title: "Successfully Opted In",
          description: "You will now receive SMS messages from YUP.RSVP.",
        });
      } else {
        throw new Error(data.error || "Failed to opt in");
      }
    } catch (error) {
      console.error("Opt-in error:", error);
      setError(error instanceof Error ? error.message : "Failed to opt in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isOptedOut) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-white">Successfully Opted Out</CardTitle>
            <CardDescription>
              You will no longer receive SMS messages from YUP.RSVP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                Your phone number {phoneNumber} has been removed from our SMS list. 
                You can opt back in at any time by visiting this page again or replying START to any previous message.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                onClick={handleOptIn}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? "Processing..." : "Opt Back In"}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => router.push("/")}
                className="w-full text-gray-400 hover:text-white"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-link-hover flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
          
          <div className="flex justify-center mb-4">
            <Phone className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-white">SMS Opt-Out</CardTitle>
          <CardDescription>
            Stop receiving SMS messages from YUP.RSVP
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-white text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              maxLength={14}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Phone className="h-4 w-4" />
            <AlertDescription>
              By clicking "Opt Out", you will no longer receive SMS messages from YUP.RSVP. 
              You can resubscribe at any time by replying START to any previous message or visiting this page again.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={handleOptOut}
              disabled={isLoading || !phoneNumber}
              className="w-full"
              variant="destructive"
            >
              {isLoading ? "Processing..." : "Opt Out of SMS"}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => router.push("/terms")}
              className="w-full text-gray-400 hover:text-white"
            >
              View Terms of Service
            </Button>
          </div>

          <div className="text-center text-xs text-gray-400">
            <p>
              Alternative ways to opt out:
            </p>
            <ul className="mt-2 space-y-1">
              <li>• Reply STOP to any SMS message</li>
              <li>• Update your account settings</li>
              <li>• Contact support@yuprsvp.com</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SMSOptOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SMSOptOutPageInner />
    </Suspense>
  );
} 