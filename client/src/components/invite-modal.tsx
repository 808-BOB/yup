
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

export default function InviteModal({ isOpen, onClose, eventId }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiRequest("POST", `/api/events/${eventId}/invitations`, {
        userIds: [email] // In a real app, you'd need to look up user IDs by email
      });
      
      toast({
        title: "Invitation Sent",
        description: "Your invitation has been sent successfully."
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Invite People</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <Button type="submit" className="w-full">Send Invitation</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
