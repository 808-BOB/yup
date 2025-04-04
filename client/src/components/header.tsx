import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <span className="text-xs font-bold text-primary tracking-widest">DU</span>
        </Button>
      </div>
    </header>
  );
}
