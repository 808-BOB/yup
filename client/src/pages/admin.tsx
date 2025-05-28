import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";

export default function Admin() {
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());

  const refreshData = () => {
    setRefreshTime(new Date().toLocaleTimeString());
  };

  return (
    <AdminGuard>
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-slate-400">YUP.RSVP System Management</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-slate-400">Last updated: {refreshTime}</span>
                <Button 
                  onClick={refreshData}
                  variant="outline" 
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  YUP.RSVP admin dashboard is operational. All systems running normally.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    </AdminGuard>
  );
}