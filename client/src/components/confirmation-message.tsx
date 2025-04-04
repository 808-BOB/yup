import { Link } from "wouter";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Event } from "@shared/schema";

interface ConfirmationMessageProps {
  response: "yup" | "nope";
  event: Event;
}

export default function ConfirmationMessage({ response, event }: ConfirmationMessageProps) {
  return (
    <div className="text-center p-8 animate-fade-in">
      {response === "yup" ? (
        <div id="yup-confirmation">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're in!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We've confirmed your attendance to {event.title}
          </p>
          <Link href="/events">
            <Button className="bg-primary text-white py-3 px-8 rounded-lg font-medium hover:bg-primary/90 transition">
              Back to Events
            </Button>
          </Link>
        </div>
      ) : (
        <div id="nope-confirmation">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Maybe next time!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We've noted that you won't be attending {event.title}
          </p>
          <Link href="/events">
            <Button className="bg-red-500 text-white py-3 px-8 rounded-lg font-medium hover:bg-red-500/90 transition">
              Back to Events
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
