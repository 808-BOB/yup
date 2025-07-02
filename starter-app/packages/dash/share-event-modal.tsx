import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2, Copy, Link, Mail, MessageSquare, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Event, type Response } from "@/types";
import ShareableEventCard from "./shareable-event-card";
import { useAuth } from "@/utils/auth-context";

interface ShareEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  userResponse?: "yup" | "nope" | "maybe";
}

export default function ShareEventModal({
  event,
  isOpen,
  onClose,
  userResponse
}: ShareEventModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"link" | "preview">("preview");
  const [linkCopied, setLinkCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  
  // Format the url for sharing
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.slug}`;
  
  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "Link Copied!",
      description: "Event link copied to clipboard",
    });
  };
  
  // Handle sharing via system share API if available
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: shareUrl,
        });
        toast({
          title: "Shared Successfully",
          description: "Event has been shared",
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback if Web Share API is not available
      handleCopyLink();
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
  
  // Handle SMS share
  const handleSmsShare = () => {
    const message = encodeURIComponent(
      `Check out this event: ${event.title} - ${shareUrl}`
    );
    window.open(`sms:?body=${message}`);
    
    toast({
      title: "SMS Opened",
      description: "Send the text message to invite others",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-gray-800 text-white">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" /> 
            </div>
            Share Event
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-base">
            Share this event with others in multiple ways
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "preview")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-600 p-1">
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-gray-400 font-medium transition-all"
            >
              Preview Card
            </TabsTrigger>
            <TabsTrigger 
              value="link" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-gray-400 font-medium transition-all"
            >
              Share Options
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-6">
            <div className="max-w-sm mx-auto">
              <ShareableEventCard 
                event={event} 
                userResponse={userResponse}
                userName={user?.email || "User"}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">
                This is how the event will appear when shared
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Event Link</label>
                <div className="flex items-center space-x-2">
                  <Input
                    ref={linkInputRef}
                    readOnly
                    value={shareUrl}
                    className="bg-gray-900 border-gray-700 text-gray-200 focus:border-primary"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyLink}
                    className="bg-gray-900 border-gray-700 hover:bg-gray-800 min-w-[80px]"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-300">Share via</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-3 bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-primary py-8 text-base"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Share</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-3 bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-primary py-8 text-base"
                    onClick={handleCopyLink}
                  >
                    <Link className="h-5 w-5" />
                    <span>Copy Link</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-3 bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-primary py-8 text-base"
                    onClick={handleEmailShare}
                  >
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-3 bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-primary py-8 text-base"
                    onClick={handleSmsShare}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Text</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between items-center">
          {activeTab === "preview" ? (
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setActiveTab("link")} className="bg-primary hover:bg-primary/90">
                Continue to Share Options
              </Button>
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={() => setActiveTab("preview")}>
                Back to Preview
              </Button>
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}