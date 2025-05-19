import { Link, useLocation } from "wouter";
import { Plus, User, LogOut, LogIn, UserPlus, Palette, Paintbrush, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding, getLogoUrl } from "@/contexts/BrandingContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import YupLogo from "@assets/Yup-logo.png";

export default function Header() {
  const { user, logout } = useAuth();
  const branding = useBranding();
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return ""; // Return empty string if name is null or undefined
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex justify-between items-center mb-6 py-4 border-b border-gray-800 sticky top-0 z-50 bg-gray-950">
      <div className="flex items-center">
        <img
          src={getLogoUrl(branding)}
          alt="Yup.RSVP"
          className="h-8 w-auto max-w-[144px] object-contain cursor-pointer"
          onClick={() => setLocation(user ? "/my-events" : "/")}
        />
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <Button
            variant="default"
            size="icon"
            onClick={() => setLocation("/events/create")}
            className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-sm"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {user ? (
              <Avatar className="cursor-pointer border border-primary w-8 h-8 bg-gray-900">
                <AvatarFallback className="bg-gray-900 text-primary text-sm">
                  {getInitials(user.display_name)}
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
                  {user.display_name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/my-events")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Events</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/upgrade")}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plans</span>
                </DropdownMenuItem>
                {/* Premium users can access branding settings */}
                {user.is_premium && (
                  <DropdownMenuItem
                    onClick={() => setLocation("/branding")}
                    className="cursor-pointer"
                  >
                    <Paintbrush className="mr-2 h-4 w-4" />
                    <span>Branding</span>
                  </DropdownMenuItem>
                )}
                {/* Admin-only link to style guide */}
                {user.is_admin && (
                  <DropdownMenuItem
                    onClick={() => setLocation("/style-guide")}
                    className="cursor-pointer"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Style Guide</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => setLocation("/auth?mode=login")}
                  className="cursor-pointer"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Log In</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/auth?mode=signup")}
                  className="cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}