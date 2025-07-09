"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { useToast } from "@/hooks/use-toast";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import Users from "lucide-react/dist/esm/icons/users";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import User from "lucide-react/dist/esm/icons/user";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Textarea } from "./textarea";

interface GuestResponseFormProps {
  eventSlug: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  maxGuestsPerRsvp?: number;
  customRSVPText?: {
    yup: string;
    nope: string;
    maybe: string;
  };
  onResponseSubmitted?: (response: any) => void;
  invitationToken?: string; // From URL param if they came from an invitation
  initialData?: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    responseType?: 'yup' | 'nope' | 'maybe';
    guestCount?: number;
  };
  brandColors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  className?: string;
}

export default function GuestResponseForm({
  eventSlug,
  eventTitle,
  eventDate,
  eventLocation,
  maxGuestsPerRsvp = 5,
  customRSVPText = { yup: 'Yes', nope: 'No', maybe: 'Maybe' },
  onResponseSubmitted,
  invitationToken,
  initialData,
  brandColors = { primary: '#3b82f6', secondary: '#f1f5f9', tertiary: '#1e293b' },
  className = ''
}: GuestResponseFormProps) {
  const { toast } = useToast();
  
  // Form state
  const [guestName, setGuestName] = useState(initialData?.guestName || '');
  const [guestEmail, setGuestEmail] = useState(initialData?.guestEmail || '');
  const [guestPhone, setGuestPhone] = useState(initialData?.guestPhone || '');
  const [responseType, setResponseType] = useState<'yup' | 'nope' | 'maybe' | null>(initialData?.responseType || null);
  const [guestCount, setGuestCount] = useState(initialData?.guestCount || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseToken, setResponseToken] = useState<string | null>(null);

  // Load any existing response if invitation token is provided
  useEffect(() => {
    const loadExistingResponse = async () => {
      if (!invitationToken) return;

      try {
        const response = await fetch(`/api/events/${eventSlug}/guest-response?inv=${invitationToken}`);
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.response) {
            // Pre-fill form with existing response
            setGuestName(data.response.guest_name || '');
            setGuestEmail(data.response.guest_email || '');
            setResponseType(data.response.response_type);
            setGuestCount(data.response.guest_count || 1);
            setHasSubmitted(true);
          } else if (data.invitation) {
            // Pre-fill form with invitation data
            setGuestName(data.invitation.recipient_name || '');
            setGuestEmail(data.invitation.recipient_email || '');
            setGuestPhone(data.invitation.recipient_phone || '');
          }
        }
      } catch (error) {
        console.error('Error loading existing response:', error);
      }
    };

    loadExistingResponse();
  }, [invitationToken, eventSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!responseType) {
      toast({
        title: "Response required",
        description: "Please select your RSVP response.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventSlug}/guest-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || undefined,
          guestPhone: guestPhone.trim() || undefined,
          responseType,
          guestCount,
          invitationToken,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setHasSubmitted(true);
        setResponseToken(result.response.response_token);
        
        toast({
          title: "RSVP Submitted! 🎉",
          description: result.message,
        });

        // Call the callback if provided
        if (onResponseSubmitted) {
          onResponseSubmitted(result);
        }
      } else {
        throw new Error(result.error || 'Failed to submit response');
      }
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResponseTypeChange = (type: 'yup' | 'nope' | 'maybe') => {
    setResponseType(type);
    
    // If selecting "nope", reset guest count to 1
    if (type === 'nope') {
      setGuestCount(1);
    }
  };

  // Helper function to get contrasting text color
  const getContrastingTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? '#ffffff' : '#000000';
  };

  const getResponseIcon = (type: string) => {
    switch (type) {
      case 'yup':
        return <Check className="w-4 h-4" />;
      case 'nope':
        return <X className="w-4 h-4" />;
      case 'maybe':
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (hasSubmitted) {
    return (
      <Card className={`w-full max-w-2xl mx-auto bg-white border-2 rounded-xl shadow-lg ${className}`}
            style={{ borderColor: brandColors.primary }}>
        <CardHeader 
          className="text-center rounded-t-xl"
          style={{ 
            backgroundColor: brandColors.primary,
            color: getContrastingTextColor(brandColors.primary)
          }}
        >
          <div 
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-white"
          >
            <Check 
              className="w-8 h-8" 
              style={{ color: brandColors.primary }}
            />
          </div>
          <CardTitle className="text-xl font-bold">RSVP Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 bg-white p-6 rounded-b-xl">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: brandColors.secondary + '20', borderColor: brandColors.primary + '30' }}>
            <h3 className="font-semibold text-lg text-gray-900">{eventTitle}</h3>
            <p className="text-gray-700">{eventDate}</p>
            {eventLocation && <p className="text-gray-700">{eventLocation}</p>}
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant="secondary"
              className="px-3 py-1"
              style={{ 
                backgroundColor: brandColors.primary, 
                color: getContrastingTextColor(brandColors.primary) 
              }}
            >
              {getResponseIcon(responseType!)}
              <span className="ml-1">
                {responseType === 'yup' ? customRSVPText.yup : 
                 responseType === 'nope' ? customRSVPText.nope : 
                 customRSVPText.maybe}
              </span>
            </Badge>
            {guestCount > 1 && (
              <Badge variant="outline" className="px-3 py-1">
                {guestCount} {guestCount === 1 ? 'person' : 'people'}
              </Badge>
            )}
          </div>

          <div className="pt-4 text-sm text-gray-700">
            <p>Want to change your response?</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-2"
              style={{
                borderColor: brandColors.primary,
                color: brandColors.primary,
                backgroundColor: 'white'
              }}
              onClick={() => setHasSubmitted(false)}
            >
              Edit Response
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto bg-white border-2 rounded-xl shadow-lg ${className}`} 
          style={{ borderColor: brandColors.primary }}>
      <CardHeader 
        className="text-center rounded-t-xl"
        style={{ 
          backgroundColor: brandColors.primary,
          color: getContrastingTextColor(brandColors.primary)
        }}
      >
        <CardTitle className="text-xl font-bold">
          RSVP to {eventTitle}
        </CardTitle>
        <div className="space-y-1">
          <p className="font-medium">{eventDate}</p>
          {eventLocation && <p className="text-sm opacity-90">{eventLocation}</p>}
        </div>
      </CardHeader>
      <CardContent className="bg-white p-6 rounded-b-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="guestName" className="flex items-center gap-2 text-gray-800 font-medium">
                <User className="w-4 h-4" />
                Your Name *
              </Label>
              <Input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="mt-1 bg-white border-2 text-gray-900 placeholder:text-gray-500 rounded-lg"
                style={{
                  borderColor: brandColors.primary + '60',
                  fontSize: '16px' // Prevents zoom on mobile
                }}
              />
            </div>

            <div>
              <Label htmlFor="guestEmail" className="flex items-center gap-2 text-gray-800 font-medium">
                <Mail className="w-4 h-4" />
                Email (optional)
              </Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="mt-1 bg-white border-2 text-gray-900 placeholder:text-gray-500 rounded-lg"
                style={{
                  borderColor: brandColors.primary + '60',
                  fontSize: '16px'
                }}
              />
              <p className="text-xs text-gray-600 mt-1">
                We'll send you event updates if provided
              </p>
            </div>

            <div>
              <Label htmlFor="guestPhone" className="flex items-center gap-2 text-gray-800 font-medium">
                <Phone className="w-4 h-4" />
                Phone (optional)
              </Label>
              <Input
                id="guestPhone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1 bg-white border-2 text-gray-900 placeholder:text-gray-500 rounded-lg"
                style={{
                  borderColor: brandColors.primary + '60',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          {/* RSVP Response */}
          <div>
            <Label className="text-base font-medium text-gray-800">Will you be attending? *</Label>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {[
                { type: 'yup' as const, label: customRSVPText.yup, icon: <Check className="w-4 h-4" /> },
                { type: 'maybe' as const, label: customRSVPText.maybe, icon: <Users className="w-4 h-4" /> },
                { type: 'nope' as const, label: customRSVPText.nope, icon: <X className="w-4 h-4" /> },
              ].map(({ type, label, icon }) => (
                <Button
                  key={type}
                  type="button"
                  variant={responseType === type ? "default" : "outline"}
                  className="h-auto py-4 px-3 flex flex-col items-center gap-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  onClick={() => handleResponseTypeChange(type)}
                  style={responseType === type ? 
                    // Selected state - use brand colors for each option
                    type === 'yup' ? {
                      backgroundColor: brandColors.primary,
                      color: getContrastingTextColor(brandColors.primary),
                      borderColor: brandColors.primary,
                      borderWidth: '2px'
                    } : type === 'maybe' ? {
                      backgroundColor: brandColors.tertiary,
                      color: getContrastingTextColor(brandColors.tertiary),
                      borderColor: brandColors.tertiary,
                      borderWidth: '2px'
                    } : {
                      backgroundColor: '#6b7280', // Keep gray for No to distinguish
                      color: '#ffffff', 
                      borderColor: '#6b7280',
                      borderWidth: '2px'
                    }
                    : 
                    // Unselected state - use brand colors for outline
                    {
                      backgroundColor: '#ffffff',
                      borderColor: type === 'yup' ? brandColors.primary : 
                                   type === 'maybe' ? brandColors.tertiary : '#6b7280',
                      color: type === 'yup' ? brandColors.primary : 
                             type === 'maybe' ? brandColors.tertiary : '#6b7280',
                      borderWidth: '2px'
                    }
                  }
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Guest Count */}
          {responseType === 'yup' && (
            <div>
              <Label htmlFor="guestCount" className="text-base font-medium text-gray-800">
                How many people? (including yourself)
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  disabled={guestCount <= 1}
                  className="bg-white border-2 text-gray-900 rounded-lg"
                  style={{ borderColor: brandColors.primary + '60' }}
                >
                  -
                </Button>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  max={maxGuestsPerRsvp}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Math.min(maxGuestsPerRsvp, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center bg-white border-2 text-gray-900 rounded-lg"
                  style={{
                    borderColor: brandColors.primary + '60',
                    fontSize: '16px'
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.min(maxGuestsPerRsvp, guestCount + 1))}
                  disabled={guestCount >= maxGuestsPerRsvp}
                  className="bg-white border-2 text-gray-900 rounded-lg"
                  style={{ borderColor: brandColors.primary + '60' }}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Maximum {maxGuestsPerRsvp} people per RSVP
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-lg"
            disabled={isSubmitting || !guestName.trim() || !responseType}
            style={{
              backgroundColor: brandColors.primary,
              color: getContrastingTextColor(brandColors.primary)
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {getResponseIcon(responseType || 'yup')}
                <span className="ml-2">Submit RSVP</span>
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-600">
              Your response will be shared with the event host
            </p>
            <p className="text-xs text-gray-500">
              or{" "}
              <a 
                href="/auth/login" 
                className="underline hover:no-underline"
                style={{ color: brandColors.primary }}
              >
                sign-in and RSVP
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 