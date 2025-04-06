import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Invite People</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-gray-300">
          Email invites coming soon. For now, please use the "share link" url to invite your friends via text or email.
        </div>
        <Button onClick={onClose} className="w-full">Close</Button>
      </DialogContent>
    </Dialog>
  );
}