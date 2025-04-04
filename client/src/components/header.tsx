import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer"; // Assuming a Footer component exists

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6 py-4 border-b border-gray-800">
      <div className="flex items-center">
        <Link href="/">
          <a className="text-2xl font-bold tracking-tight font-mono">
            YUP<span className="text-primary font-bold">.RSVP</span>
          </a>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/events/create">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary hover:text-primary/80 hover:bg-gray-800 transition border border-gray-800 rounded-sm"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-sm bg-gray-900 border border-primary w-8 h-8 flex items-center justify-center"
        >
          <Avatar> {/* Added Avatar component */}
            <AvatarFallback>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}

// Added Footer component to the end of the file.  Assume this component is defined elsewhere
<Footer/>