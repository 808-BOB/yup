"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Alert, AlertDescription } from "@/ui/alert";
import { Badge } from "@/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Send, Settings } from "lucide-react";

interface EnvCheck {
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasPhoneNumber: boolean;
  hasVerifyServiceSid: boolean;
  allConfigured: boolean;
}

interface DiagnosticResult {
  success: boolean;
  account?: {
    sid: string;
    friendlyName: string;
    status: string;
  };
  verifyService?: {
    sid: string;
    friendlyName: string;
    status: string;
  };
  phoneNumber?: string;
  error?: string;
  details?: string;
}

interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export default function TestSMSPage() {
  const [envCheck, setEnvCheck] = useState<EnvCheck | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);
  
  // SMS Test Form
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from Yup.RSVP! This is a test message. 🎉');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsResult, setSmsResult] = useState<SMSResult | null>(null);

  // Phone Verification Test
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Load environment check on mount
  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    setIsLoadingEnv(true);
    try {
      const response = await fetch('/api/test-twilio');
      const data = await response.json();
      setEnvCheck(data.environment || data);
    } catch (error) {
      console.error('Failed to check environment:', error);
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const runDiagnostics = async () => {
    setIsLoadingDiagnostic(true);
    try {
      const response = await fetch('/api/test/sms-diagnostic');
      const data = await response.json();
      setDiagnosticResult(data);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      setDiagnosticResult({
        success: false,
        error: 'Failed to connect to diagnostic endpoint'
      });
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhoneNumber || !testMessage) {
      setSmsResult({
        success: false,
        error: 'Phone number and message are required'
      });
      return;
    }

    setIsSendingSMS(true);
    setSmsResult(null);

    try {
      const response = await fetch('/api/sms/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          eventName: 'SMS Test Event',
          eventDate: new Date().toLocaleDateString(),
          rsvpLink: 'https://yup.rsvp/test-sms'
        }),
      });

      const data = await response.json();
      setSmsResult(data);
    } catch (error) {
      setSmsResult({
        success: false,
        error: 'Failed to send test SMS'
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!verifyPhoneNumber) {
      setVerificationResult({
        success: false,
        error: 'Phone number is required'
      });
      return;
    }

    setIsSendingVerification(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: verifyPhoneNumber
        }),
      });

      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({
        success: false,
        error: 'Failed to send verification code'
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const verifyCode = async () => {
    if (!verifyPhoneNumber || !verificationCode) {
      setVerificationResult({
        success: false,
        error: 'Phone number and verification code are required'
      });
      return;
    }

    setIsVerifyingCode(true);

    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: verifyPhoneNumber,
          code: verificationCode
        }),
      });

      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({
        success: false,
        error: 'Failed to verify code'
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const getE164Phone = (formattedPhone: string) => {
    const cleaned = formattedPhone.replace(/\D/g, "");
    return `+1${cleaned}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Yup.RSVP branding */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl font-bold">
              <span className="text-white">YUP.</span>
                              <span className="text-[#FF00FF]">RSVP</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SMS Testing Console</h1>
          <p className="text-gray-400">Test your Twilio configuration and SMS functionality</p>
                          <div className="w-24 h-1 bg-gradient-to-r from-[#FF00FF] to-purple-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Environment Check */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-800/50">
            <CardTitle className="text-white flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Environment Variables
            </CardTitle>
            <CardDescription className="text-gray-400">
              Check if all required Twilio environment variables are configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingEnv ? (
              <div className="text-gray-400">Loading environment check...</div>
            ) : envCheck ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {envCheck.hasAccountSid ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm text-gray-300">Account SID</span>
                </div>
                <div className="flex items-center gap-2">
                  {envCheck.hasAuthToken ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm text-gray-300">Auth Token</span>
                </div>
                <div className="flex items-center gap-2">
                  {envCheck.hasPhoneNumber ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm text-gray-300">Phone Number</span>
                </div>
                <div className="flex items-center gap-2">
                  {envCheck.hasVerifyServiceSid ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm text-gray-300">Verify Service</span>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Failed to load environment check</AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={checkEnvironment} 
                disabled={isLoadingEnv} 
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
              >
                Refresh Check
              </Button>
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoadingDiagnostic} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                {isLoadingDiagnostic ? 'Running...' : 'Run Full Diagnostics'}
              </Button>
            </div>

            {diagnosticResult && (
              <Alert className={diagnosticResult.success ? "border-green-600" : "border-red-600"}>
                <AlertDescription>
                  {diagnosticResult.success ? (
                    <div className="space-y-2">
                      <div className="text-green-400 font-medium">✅ Twilio Connection Successful</div>
                      {diagnosticResult.account && (
                        <div className="text-sm text-gray-300">
                          Account: {diagnosticResult.account.friendlyName} ({diagnosticResult.account.status})
                        </div>
                      )}
                      {diagnosticResult.verifyService && (
                        <div className="text-sm text-gray-300">
                          Verify Service: {diagnosticResult.verifyService.friendlyName}
                        </div>
                      )}
                      {diagnosticResult.phoneNumber && (
                        <div className="text-sm text-gray-300">
                          Phone: {diagnosticResult.phoneNumber}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-red-400 font-medium">❌ {diagnosticResult.error}</div>
                      {diagnosticResult.details && (
                        <div className="text-sm text-gray-300">{diagnosticResult.details}</div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* SMS Test */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Send className="h-5 w-5" />
              SMS Invite Test
            </CardTitle>
            <CardDescription className="text-gray-400">
              Send a test SMS invite message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone" className="text-gray-300">Test Phone Number</Label>
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testMessage" className="text-gray-300">Custom Message (Optional)</Label>
                <Textarea
                  id="testMessage"
                  placeholder="Custom test message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={sendTestSMS} 
              disabled={isSendingSMS || !testPhoneNumber}
              className="w-full"
            >
              {isSendingSMS ? 'Sending...' : 'Send Test SMS'}
            </Button>

            {smsResult && (
              <Alert className={smsResult.success ? "border-green-600" : "border-red-600"}>
                <AlertDescription>
                  {smsResult.success ? (
                    <div className="space-y-1">
                      <div className="text-green-400 font-medium">✅ SMS Sent Successfully!</div>
                      <div className="text-sm text-gray-300">Message SID: {smsResult.messageSid}</div>
                    </div>
                  ) : (
                    <div className="text-red-400">❌ {smsResult.error}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Phone Verification Test */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Phone Verification Test</CardTitle>
            <CardDescription className="text-gray-400">
              Test the phone verification flow with SMS codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="verifyPhone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="verifyPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={verifyPhoneNumber}
                  onChange={(e) => setVerifyPhoneNumber(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verifyCode" className="text-gray-300">Verification Code</Label>
                <Input
                  id="verifyCode"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={sendVerificationCode} 
                disabled={isSendingVerification || !verifyPhoneNumber}
                variant="outline"
                className="flex-1"
              >
                {isSendingVerification ? 'Sending...' : 'Send Code'}
              </Button>
              <Button 
                onClick={verifyCode} 
                disabled={isVerifyingCode || !verifyPhoneNumber || !verificationCode}
                className="flex-1"
              >
                {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>

            {verificationResult && (
              <Alert className={verificationResult.success ? "border-green-600" : "border-red-600"}>
                <AlertDescription>
                  {verificationResult.success ? (
                    <div className="space-y-1">
                      <div className="text-green-400 font-medium">
                        ✅ {verificationResult.verified ? 'Code Verified!' : 'Verification Code Sent!'}
                      </div>
                      {verificationResult.status && (
                        <div className="text-sm text-gray-300">Status: {verificationResult.status}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-400">❌ {verificationResult.error}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-300 text-sm">
            <div>1. <strong>Environment Check:</strong> Ensure all variables show green checkmarks</div>
            <div>2. <strong>Run Diagnostics:</strong> Verify Twilio connection and service status</div>
            <div>3. <strong>SMS Test:</strong> Send a test invite message to your phone</div>
            <div>4. <strong>Verification Test:</strong> Test the phone verification flow</div>
            <div className="mt-4 p-3 bg-gray-800 rounded">
              <strong>Note:</strong> This page is for testing only. No data is saved to the database.
              Use a real phone number you control for testing.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 