"use client";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/utils/use-toast";
import { supabase } from "@/lib/supabase";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
// import { Label } from "@/ui/label";
import { Separator } from "@/ui/separator";
import { Alert, AlertDescription } from "@/ui/alert";
import { Phone, Shield, CheckCircle } from "lucide-react";

export default function PhoneVerificationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // If user already has a phone number, redirect to my-events
  React.useEffect(() => {
    if (user?.phone_number) {
      router.push("/my-events");
    }
  }, [user, router]);

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

  // Convert formatted phone to E.164 format for API
  const getE164Phone = (formattedPhone: string) => {
    const cleaned = formattedPhone.replace(/\D/g, "");
    return `+1${cleaned}`;
  };

  const handleSendVerification = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const e164Phone = getE164Phone(phoneNumber);
      
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: e164Phone }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Code Sent",
          description: "Check your phone for the verification code.",
        });
        setStep("verify");
      } else {
        throw new Error(data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Send verification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    // Prevent double submission
    if (isVerifying) {
      console.log("Verification already in progress, ignoring duplicate request");
      return;
    }

    setIsVerifying(true);

    try {
      const e164Phone = getE164Phone(phoneNumber);
      
      console.log("Starting phone verification for:", e164Phone);
      
      const response = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phoneNumber: e164Phone, 
          code: verificationCode 
        }),
      });

      const data = await response.json();
      console.log("Verification API response:", { status: response.status, data });

      if (response.ok && data.verified) {
        console.log("Phone verification successful, updating user profile...");
        
        // Show immediate success feedback
        toast({
          title: "Phone Verified!",
          description: "Updating your profile...",
        });

        // Get the current session to include in the authorization header
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.access_token) {
          throw new Error("No valid session found. Please log in again.");
        }

        console.log("Using session token for profile update");

        // Update user's phone number in the database
        const updateResponse = await fetch(`/api/users/${user?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ phone_number: e164Phone }),
        });

        const updateData = await updateResponse.json();
        console.log("User update API response:", { status: updateResponse.status, data: updateData });

        if (updateResponse.ok) {
          toast({
            title: "Phone Verified Successfully",
            description: "Your phone number has been added to your account.",
          });
          
          console.log("Profile updated successfully, refreshing user and redirecting...");
          
          // Refresh user data and redirect
          await refreshUser();
          router.push("/my-events");
        } else {
          console.error("Failed to update user profile:", updateData);
          throw new Error(updateData.error || "Failed to update user profile");
        }
      } else {
        console.error("Phone verification failed:", data);
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("Verify code error:", error);
      
      // Clear the verification code so user doesn't try to resubmit the same code
      setVerificationCode("");
      
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setVerificationCode("");
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const e164Phone = getE164Phone(phoneNumber);
      
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: e164Phone }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "New Code Sent",
          description: "A new verification code has been sent to your phone.",
        });
        setVerificationCode(""); // Clear the old code
      } else {
        throw new Error(data.error || "Failed to send new verification code");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send new code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // Allow users to skip for now, but they'll be prompted again later
    router.push("/my-events");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === "phone" ? (
              <Phone className="h-12 w-12 text-primary" />
            ) : (
              <Shield className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-white">
            {step === "phone" ? "Add Your Phone Number" : "Verify Your Phone"}
          </CardTitle>
          <CardDescription>
            {step === "phone" 
              ? "We'll use this for important event notifications and security."
              : `Enter the 6-digit code sent to ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-white text-sm font-medium">Phone Number</label>
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

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your phone number will be kept private and only used for account security and event notifications.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button 
                  onClick={handleSendVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>

                <Separator />

                <Button 
                  variant="ghost" 
                  onClick={handleSkipForNow}
                  className="w-full text-gray-400 hover:text-white"
                >
                  Skip for now
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="code" className="text-white text-sm font-medium">Verification Code</label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(cleaned);
                    
                    // Auto-submit when 6 digits are entered
                    if (cleaned.length === 6 && !isVerifying) {
                      setTimeout(() => handleVerifyCode(), 100);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && verificationCode.length === 6 && !isVerifying) {
                      handleVerifyCode();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-center text-lg tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleVerifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full"
                >
                  {isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Phone Number"
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Sending..." : "Resend Code"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 