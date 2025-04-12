import { Link, useLocation } from "wouter";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface ConfirmationMessageProps {
  response: "yup" | "nope";
  event: Event;
}

export default function ConfirmationMessage({
  response,
  event,
}: ConfirmationMessageProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="text-center p-8 animate-fade-in">
      {response === "yup" ? (
        <div id="yup-confirmation">
          <div className="w-24 h-24 rounded-full bg-gray-900 border border-primary flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">YOU'RE IN</h2>
          <p className="text-gray-400 mb-8 tracking-tight">
            We've confirmed your attendance to {event.title}
          </p>
          <div className="flex flex-col gap-4">
            <Button 
              className="btn-yup py-3 px-8 rounded-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition"
              onClick={() => window.location.href = user ? "/my-events" : `/events/${event.slug}`}
            >
              {user ? "Back to Events" : "Back to Event"}
            </Button>
            {!user && (
              <Link href="/login">
                <Button variant="outline" className="py-3 px-8 rounded-sm font-medium">
                  Login to Manage RSVPs
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div id="nope-confirmation">
          <div className="w-24 h-24 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">
            MAYBE NEXT TIME
          </h2>
          <p className="text-gray-400 mb-8 tracking-tight">
            We've noted that you won't be attending {event.title}
          </p>
          <div className="flex flex-col gap-4">
            <Button 
              className="btn-nope py-3 px-8 rounded-sm font-bold uppercase tracking-wider"
              onClick={() => window.location.href = user ? "/my-events" : `/events/${event.slug}`}
            >
              {user ? "Back to Events" : "Back to Event"}
            </Button>
            {!user && (
              <Link href="/login">
                <Button variant="outline" className="py-3 px-8 rounded-sm font-medium">
                  Login to Manage RSVPs
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}