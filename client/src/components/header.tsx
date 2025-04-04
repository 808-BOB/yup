import { Link } from "wouter";
import { Plus, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6 py-4 border-b border-gray-800">
      <div className="flex items-center">
        <div 
          onClick={() => window.location.href = "/"} 
          className="text-2xl font-bold tracking-tight font-mono cursor-pointer"
        >
          YUP<span className="text-primary font-bold">.RSVP</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/events/create">
          <Button 
            variant="default"
            size="icon" 
            className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-sm"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-sm bg-gray-900 border border-primary w-8 h-8 flex items-center justify-center"
            >
              <User className="h-4 w-4 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => window.location.href = "/my-events"}>
              <User className="mr-2 h-4 w-4" />
              <span>My Events</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Logout functionality coming soon!")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
