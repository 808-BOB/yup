import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const guestFormSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestCount: z.number().min(0).default(0),
});

type FormData = z.infer<typeof guestFormSchema>;

interface GuestRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  response: "yup" | "nope";
  onSuccess: (response: "yup" | "nope") => void;
}

export default function GuestRsvpModal({
  isOpen,
  onClose,
  event,
  response,
  onSuccess,
}: GuestRsvpModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [guestCount, setGuestCount] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestCount: 0,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/guest-responses", {
        eventId: event.id,
        response,
        isGuest: true,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestCount,
      });

      onSuccess(response);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your RSVP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>RSVP to {event.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {response === "yup"
                ? "Great! Please fill in your details to confirm your attendance."
                : "Please fill in your details to confirm you can't attend."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                {...form.register("guestName")}
                className="bg-gray-800 border-gray-700"
              />
              {form.formState.errors.guestName && (
                <p className="text-red-500 text-sm">{form.formState.errors.guestName.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...form.register("guestEmail")}
                className="bg-gray-800 border-gray-700"
              />
              {form.formState.errors.guestEmail && (
                <p className="text-red-500 text-sm">{form.formState.errors.guestEmail.message}</p>
              )}
            </div>

            {response === "yup" && event.allowPlusOne && (
              <div className="grid gap-2">
                <Label htmlFor="guests">Number of Additional Guests</Label>
                <Select
                  onValueChange={(value) => setGuestCount(Number(value))}
                  defaultValue="0"
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: event.maxGuestsPerRsvp + 1 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i === 0 ? "Just me" : i === 1 ? `+1 guest` : `+${i} guests`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={response === "yup" ? "bg-primary hover:bg-primary/90" : "bg-gray-700 hover:bg-gray-600"}
            >
              {isSubmitting ? "Submitting..." : "Submit RSVP"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}