import { useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-[#84793d]" />
          <p className="text-lg">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check if user is Bob (admin)
  const isAdmin = user.username === "bob" || user.display_name === "Bob";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3 text-red-400" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              You don't have permission to access the admin dashboard. This area is restricted to authorized administrators only.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/my-events")}
                className="bg-[#84793d] hover:bg-[#6b5f31] text-white"
              >
                Go to My Events
              </Button>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}