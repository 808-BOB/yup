import { Link, useLocation } from "wouter";
import { Plus, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    setLocation("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex justify-between items-center mb-6 py-4 border-b border-gray-800">
      <div className="flex items-center">
        <Link href="/">
          <div className="text-2xl font-bold tracking-tight font-mono cursor-pointer">
            YUP<span className="text-primary font-bold">.RSVP</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <Link href="/events/create">
            <Button 
              variant="default"
              size="icon" 
              className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-sm"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {user ? (
              <Avatar className="cursor-pointer border border-primary w-8 h-8 bg-gray-900">
                <AvatarFallback className="bg-gray-900 text-primary text-sm">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-sm bg-gray-900 border border-primary w-8 h-8 flex items-center justify-center"
              >
                <User className="h-4 w-4 text-primary" />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user ? (
              <>
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.displayName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-events" className="cursor-pointer flex w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Events</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/login" className="cursor-pointer flex w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Log In</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/signup" className="cursor-pointer flex w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
