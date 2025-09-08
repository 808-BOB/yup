"use client";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function DebugUserPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [userRecord, setUserRecord] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const debug = async () => {
      try {
        console.log("🔍 DEBUG - Auth user object:", user);
        console.log("🔍 DEBUG - User ID:", user.id);
        console.log("🔍 DEBUG - User ID type:", typeof user.id);
        console.log("🔍 DEBUG - User ID length:", user.id?.length);

        // Check if user exists in users table
        const { data: userFromDB, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log("🔍 DEBUG - User from DB:", userFromDB);
        console.log("🔍 DEBUG - User query error:", userError);
        setUserRecord(userFromDB);

        // Check events for this user
        const { data: eventsFromDB, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('host_id', user.id);

        console.log("🔍 DEBUG - Events from DB:", eventsFromDB);
        console.log("🔍 DEBUG - Events query error:", eventsError);
        setEvents(eventsFromDB || []);

        if (userError || eventsError) {
          setError(`User Error: ${userError?.message || 'None'}, Events Error: ${eventsError?.message || 'None'}`);
        }
      } catch (err) {
        console.error("🔍 DEBUG - Exception:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    debug();
  }, [user]);

  // Note: Auth is guaranteed by middleware, so we only need to check if user is loaded
  if (!user) {
    return <div className="p-8 text-white">Loading user data...</div>;
  }

  return (
    <div className="p-8 text-white bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔍 User Debug Information</h1>
      
      <div className="space-y-6">
        {/* Auth User Info */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-blue-400">Auth Context User</h2>
          <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email,
              display_name: user.display_name,
              is_premium: user.is_premium,
              is_pro: user.is_pro,
              is_admin: user.is_admin,
            }, null, 2)}
          </pre>
        </div>

        {/* Database User Info */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-green-400">Database User Record</h2>
          {userRecord ? (
            <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto">
              {JSON.stringify(userRecord, null, 2)}
            </pre>
          ) : (
            <p className="text-red-400">❌ No user record found in database!</p>
          )}
        </div>

        {/* Events Info */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-purple-400">User Events</h2>
          {events.length > 0 ? (
            <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto">
              {JSON.stringify(events, null, 2)}
            </pre>
          ) : (
            <p className="text-yellow-400">📝 No events found for this user</p>
          )}
          <p className="text-sm text-gray-400 mt-2">Event count: {events.length}</p>
        </div>

        {/* Error Info */}
        {error && (
          <div className="bg-red-900 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3 text-red-400">Errors</h2>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* UUID Validation */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-yellow-400">UUID Validation</h2>
          <div className="space-y-2 text-sm">
            <p>User ID: <code className="bg-gray-800 px-2 py-1 rounded">{user.id}</code></p>
            <p>Length: {user.id?.length} characters</p>
            <p>Is Valid UUID: {
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) 
                ? "✅ Yes" 
                : "❌ No"
            }</p>
          </div>
        </div>
      </div>
    </div>
  );
} 