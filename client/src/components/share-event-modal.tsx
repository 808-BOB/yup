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
import { Share2, Copy, Link, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Event, type Response } from "@shared/schema";
import ShareableEventCard from "./shareable-event-card";
import { useAuth } from "@/contexts/AuthContext";

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
  const linkInputRef = useRef<HTMLInputElement>(null);
  
  // Format the url for sharing
  const shareUrl = `${window.location.origin}/events/${event.slug}`;
  
  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
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
      `Date: ${event.date}${event.startTime ? ` at ${event.startTime}` : ''}\n` +
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
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> 
            Share Event
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Share this event with others in multiple ways
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "preview")}>
          <TabsList className="bg-gray-800 border border-gray-700 mb-4">
            <TabsTrigger value="preview" className="data-[state=active]:bg-gray-700">
              Preview Card
            </TabsTrigger>
            <TabsTrigger value="link" className="data-[state=active]:bg-gray-700">
              Share Options
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="max-w-sm mx-auto">
              <ShareableEventCard 
                event={event} 
                userResponse={userResponse}
                userName={user?.displayName || user?.username}
              />
            </div>
            <p className="text-sm text-gray-400 text-center mt-4">
              This is how the event will appear when shared
            </p>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={linkInputRef}
                readOnly
                value={shareUrl}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                onClick={handleCopyLink}
              >
                <Link className="h-4 w-4" />
                <span>Copy Link</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                onClick={handleEmailShare}
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                onClick={handleSmsShare}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Text</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4 flex justify-end">
          {activeTab === "preview" ? (
            <Button onClick={() => setActiveTab("link")}>
              Continue to Share Options
            </Button>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}