"use client";

import React, { useState } from "react";
import type { FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, Share2, MessageSquare, ChevronRight } from "lucide-react";
import { useToast } from "@/utils/use-toast";
import { type Event as BaseEvent } from "@/types/index";
import { type HostBranding } from "./event-branding-provider";
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

const ShareEventModal: FC<ShareEventModalProps> = ({
  event,
  isOpen,
  onClose,
  userResponse
}) => {
  const { toast } = useToast();
  const [shareUrl] = useState(`${window.location.origin}/events/${event.slug}`);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingSMS, setIsSendingSMS] = useState(false);

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

  // Handle email share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invitation: ${event.title}`);
    const body = encodeURIComponent(
      `Check out this event: ${event.title}\n\n` +
      `Date: ${event.date}${event.start_time ? ` at ${event.start_time}` : ''}\n` +
      `${event.location ? `Location: ${event.location}\n` : ''}` +
      `\nView and respond here: ${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
    toast({
      title: "Email Opened",
      description: "Send the pre-filled email to invite others",
    });
  };

  // Handle SMS share via native app (fallback)
  const handleNativeSmsShare = () => {
    const message = encodeURIComponent(
      `Check out this event: ${event.title} - ${shareUrl}`
    );
    window.open(`sms:?body=${message}`);
    
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleCopyLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Send branded invite to phone number
                </Label>
                <p className="text-xs text-gray-500 mb-2">
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
                />
                <Button 
                  onClick={handleSendBrandedSMS}
                  disabled={isSendingSMS || !phoneNumber.trim()}
                  size="icon"
                >
                  {isSendingSMS ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="border-t pt-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleNativeSmsShare}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Use Phone's SMS App
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="other" className="space-y-4">
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEmailShare}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: `Check out this event: ${event.title}`,
                      url: shareUrl,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareEventModal;