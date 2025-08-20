"use client";

import React, { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Copy, Mail, Share2, MessageSquare, ChevronRight } from "lucide-react";
import { useToast } from "@/utils/use-toast";
import { type Event as BaseEvent } from "@/types/index";
import { type HostBranding } from "./event-branding-provider";
import { useBranding } from "@/contexts/BrandingContext";
import ShareableEventCard from "./shareable-event-card";
import EventBrandingProvider from "./event-branding-provider";
import { formatDate } from "@/utils/utils/date-formatter";

// Extended Event type with host branding
type Event = BaseEvent & {
  hostDisplayName?: string;
  hostBranding?: HostBranding | null;
};

interface ShareEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  userResponse?: 'yup' | 'nope' | 'maybe';
}

const ShareEventModal = ({
  event,
  isOpen,
  onClose,
  userResponse
}) => {
  const { toast } = useToast();
  const branding = useBranding();
  const [shareUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/events/${event.slug}`;
    }
    return `/events/${event.slug}`;
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // Helper function to ensure text contrast
  const getContrastingTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance < 0.5 ? '#ffffff' : '#000000';
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Please try copying the link manually",
        variant: "destructive",
      });
    }
  };

  // State for email invitation
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Handle email invitation
  const handleSendInvitations = async () => {
    if (!emailRecipients.trim()) {
      toast({
        title: "Email required",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Parse email addresses (comma or line separated)
      const emails = emailRecipients
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      if (emails.length === 0) {
        throw new Error('No valid email addresses found');
      }

      // Prepare recipients
      const recipients = emails.map(email => ({
        email,
        name: email.split('@')[0] // Use email prefix as name
      }));

      // Send invitations
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          hostId: event.host_id,
          method: 'email',
          recipients
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitations');
      }

      const result = await response.json();
      const successCount = result.results?.filter((r: any) => r.success).length || 0;
      const totalCount = emails.length;

      toast({
        title: "Invitations sent!",
        description: `Successfully sent ${successCount} of ${totalCount} invitations`,
        variant: successCount === totalCount ? "default" : "destructive"
      });

      // Clear form and close
      setEmailRecipients('');
      setShowEmailForm(false);

    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Failed to send invitations",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle email preview
  const handlePreviewEmail = async () => {
    try {
      const response = await fetch('/api/invitations/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          hostId: event.host_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const result = await response.json();
      setPreviewHtml(result.html);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message || "Could not generate email preview",
        variant: "destructive"
      });
    }
  };

  // Handle SMS share via native app (fallback)
  const handleNativeSmsShare = () => {
    const message = encodeURIComponent(
      `Check out this event: ${event.title} - ${shareUrl}`
    );
    
    if (typeof window !== 'undefined') {
      window.open(`sms:?body=${message}`);
    }
    
    toast({
      title: "SMS Opened",
      description: "Send the text message to invite others",
    });
  };

  // Handle branded SMS invite via API
  const handleSendBrandedSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to send the invite",
        variant: "destructive",
      });
      return;
    }

    setIsSendingSMS(true);

    try {
      const response = await fetch('/api/sms/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          eventName: event.title,
          eventDate: formatDate(event.date),
          rsvpLink: shareUrl,
          hostId: event.host_id, // Pass host ID for branding
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invite Sent! 🎉",
          description: result.branding?.hasCustomColors || result.branding?.hasLogo 
            ? "Branded SMS invite sent with your custom branding"
            : "SMS invite sent successfully",
        });
        setPhoneNumber(""); // Clear the input
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS invite:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send SMS invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg border-2"
        style={{
          backgroundColor: branding.theme.secondary,
          borderColor: branding.theme.primary,
          color: getContrastingTextColor(branding.theme.secondary)
        }}
      >
        <DialogHeader>
          <DialogTitle 
            style={{ 
              color: getContrastingTextColor(branding.theme.secondary) 
            }}
          >
            Share Event
          </DialogTitle>
        </DialogHeader>
        
        {/* Preview Card */}
        <EventBrandingProvider 
          hostBranding={event.hostBranding || null} 
          enabled={!!event.hostBranding}
        >
          <div className="space-y-6">
            <ShareableEventCard
              event={event}
              userResponse={userResponse}
              className="w-full"
            />
          </div>
        </EventBrandingProvider>

        {/* Share Tabs */}
        <Tabs defaultValue="link" className="w-full">
          <TabsList 
            className="grid w-full grid-cols-3 border"
            style={{
              backgroundColor: branding.theme.secondary,
              borderColor: branding.theme.primary + '40'
            }}
          >
            <TabsTrigger 
              value="link"
              className="border-0"
              style={{
                color: getContrastingTextColor(branding.theme.secondary),
                backgroundColor: 'transparent'
              }}
            >
              Link
            </TabsTrigger>
            <TabsTrigger 
              value="sms"
              className="border-0"
              style={{
                color: getContrastingTextColor(branding.theme.secondary),
                backgroundColor: 'transparent'
              }}
            >
              SMS
            </TabsTrigger>
            <TabsTrigger 
              value="other"
              className="border-0"
              style={{
                color: getContrastingTextColor(branding.theme.secondary),
                backgroundColor: 'transparent'
              }}
            >
              Email
            </TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="link" 
            className="space-y-4"
            style={{
              backgroundColor: branding.theme.secondary,
              color: getContrastingTextColor(branding.theme.secondary)
            }}
          >
            <div className="flex items-center space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                style={{
                  backgroundColor: branding.theme.secondary,
                  borderColor: branding.theme.primary + '60',
                  color: getContrastingTextColor(branding.theme.secondary)
                }}
              />
              <Button 
                onClick={handleCopyLink} 
                size="icon"
                style={{
                  backgroundColor: branding.theme.primary,
                  borderColor: branding.theme.primary,
                  color: getContrastingTextColor(branding.theme.primary)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="sms" 
            className="space-y-4"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000'
            }}
          >
            <div className="space-y-3" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <Label 
                  htmlFor="phone" 
                  className="text-sm font-medium"
                  style={{ color: '#000000' }}
                >
                  Send branded invite to phone number
                </Label>
                <p 
                  className="text-xs mb-2"
                  style={{ 
                    color: '#666666'
                  }}
                >
                  {event.hostBranding || (event as any).logo_url || (event as any).brand_primary_color
                    ? "This will include your custom branding, logo, and RSVP options"
                    : "Invite will include your custom RSVP text if available"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: branding.theme.primary + '60',
                    color: '#000000'
                  }}
                />
                <Button 
                  onClick={handleSendBrandedSMS}
                  disabled={isSendingSMS || !phoneNumber.trim()}
                  size="icon"
                  style={{
                    backgroundColor: branding.theme.primary,
                    borderColor: branding.theme.primary,
                    color: getContrastingTextColor(branding.theme.primary)
                  }}
                >
                  {isSendingSMS ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div 
                className="border-t pt-3"
                style={{ borderColor: branding.theme.primary + '40' }}
              >
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleNativeSmsShare}
                  style={{
                    borderColor: branding.theme.primary + '60',
                    backgroundColor: 'transparent',
                    color: '#000000'
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Use Phone's SMS App
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="other" 
            className="space-y-4"
            style={{
              backgroundColor: branding.theme.secondary,
              color: getContrastingTextColor(branding.theme.secondary)
            }}
          >
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEmailForm(!showEmailForm)}
                style={{
                  borderColor: branding.theme.primary + '60',
                  backgroundColor: showEmailForm ? branding.theme.primary + '20' : 'transparent',
                  color: showEmailForm ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary)
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                {showEmailForm ? 'Hide Email Form' : 'Send Invitations'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (typeof window !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: `Check out this event: ${event.title}`,
                      url: shareUrl,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
                style={{
                  borderColor: branding.theme.primary + '60',
                  backgroundColor: 'transparent',
                  color: getContrastingTextColor(branding.theme.secondary)
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Email Invitation Form */}
            {showEmailForm && (
              <div className="mt-6 p-4 border rounded-lg space-y-4" style={{ 
                borderColor: branding.theme.primary + '40',
                backgroundColor: branding.theme.secondary + '80'
              }}>
                <div>
                  <Label className="text-sm font-medium" style={{ color: getContrastingTextColor(branding.theme.secondary) }}>
                    Email Addresses
                  </Label>
                  <Textarea
                    placeholder="Enter email addresses (one per line or comma separated)&#10;example@email.com&#10;friend@email.com"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    className="mt-1 bg-transparent border-gray-600 focus:border-primary"
                    rows={4}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Invitations will include your event branding and a link to RSVP
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviewEmail}
                    className="flex-1"
                    style={{
                      borderColor: branding.theme.primary + '60',
                      color: getContrastingTextColor(branding.theme.secondary)
                    }}
                  >
                    Preview Email
                  </Button>
                  <Button
                    onClick={handleSendInvitations}
                    disabled={sendingEmail || !emailRecipients.trim()}
                    className="flex-1"
                    style={{
                      backgroundColor: branding.theme.primary,
                      color: getContrastingTextColor(branding.theme.primary)
                    }}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Invitations'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Email Preview Modal */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div 
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{ 
                  maxHeight: '60vh', 
                  overflow: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    setShowEmailForm(true);
                  }}
                  className="flex-1"
                  style={{
                    backgroundColor: branding.theme.primary,
                    color: getContrastingTextColor(branding.theme.primary)
                  }}
                >
                  Back to Send Form
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default ShareEventModal;