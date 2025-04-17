import { useLocation } from "wouter";
import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface ConfirmationMessageProps {
  response: "yup" | "nope" | "maybe";
  event: Event;
  onNavigate?: (target: string) => void;
}

export default function ConfirmationMessage({
  response,
  event,
  onNavigate,
}: ConfirmationMessageProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Function to handle navigation either through prop or fallback to direct location setting
  const handleNavigate = (target: string) => {
    if (onNavigate) {
      onNavigate(target);
    } else {
      setLocation(target);
    }
  };

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
              onClick={() => handleNavigate(user ? "/my-events" : `/events/${event.slug}`)}
            >
              {user ? "Back to Events" : "Back to Event"}
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                className="py-3 px-8 rounded-sm font-medium"
                onClick={() => handleNavigate("/login")}
              >
                Login to Manage RSVPs
              </Button>
            )}
          </div>
        </div>
      ) : response === "nope" ? (
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
              onClick={() => handleNavigate(user ? "/my-events" : `/events/${event.slug}`)}
            >
              {user ? "Back to Events" : "Back to Event"}
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                className="py-3 px-8 rounded-sm font-medium"
                onClick={() => handleNavigate("/login")}
              >
                Login to Manage RSVPs
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div id="maybe-confirmation">
          <div className="w-24 h-24 rounded-full bg-gray-900 border border-yellow-700 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">
            WE'LL KEEP YOU POSTED
          </h2>
          <p className="text-gray-400 mb-8 tracking-tight">
            We've marked you as unsure for {event.title}. You can change your response anytime.
          </p>
          <div className="flex flex-col gap-4">
            <Button 
              className="py-3 px-8 rounded-sm font-bold uppercase tracking-wider bg-yellow-900/50 hover:bg-yellow-900/60 text-yellow-500"
              onClick={() => handleNavigate(user ? "/my-events" : `/events/${event.slug}`)}
            >
              {user ? "Back to Events" : "Back to Event"}
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                className="py-3 px-8 rounded-sm font-medium"
                onClick={() => handleNavigate("/login")}
              >
                Login to Manage RSVPs
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}