"use client";
import { useAuth } from "@/utils/auth-context";

export default function DebugProfilePage() {
  const { user, isLoading } = useAuth();

  console.log("Debug Profile - isLoading:", isLoading);
  console.log("Debug Profile - user:", user);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Debug</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Is Loading:</strong> {isLoading ? "true" : "false"}
        </div>
        
        <div>
          <strong>User Object:</strong> 
          <pre className="mt-2 p-4 bg-gray-800 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <strong>User Email:</strong> {user?.email || "No email"}
        </div>

        <div>
          <strong>User ID:</strong> {user?.id || "No ID"}
        </div>

        <div>
          <strong>Display Name:</strong> {(user as any)?.display_name || "No display name"}
        </div>
      </div>
    </div>
  );
} 