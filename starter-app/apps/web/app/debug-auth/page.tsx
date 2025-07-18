"use client";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

// Force dynamic rendering for this debug page
export const dynamic = 'force-dynamic';

export default function DebugAuthPage() {
  const { user, isLoading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [userDbRecord, setUserDbRecord] = useState<any>(null);
  const [authSteps, setAuthSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addStep = (step: string) => {
    console.log("🔍 AUTH STEP:", step);
    setAuthSteps(prev => [...prev, `${new Date().toLocaleTimeString()}: ${step}`]);
  };

  useEffect(() => {
    addStep("Debug page useEffect triggered");
    addStep(`Auth loading: ${isLoading}, User exists: ${!!user}`);
    
    const checkAuth = async () => {
      try {
        addStep("Checking Supabase session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("🔍 DEBUG - Supabase session:", session);
        console.log("🔍 DEBUG - Session error:", error);
        console.log("🔍 DEBUG - Auth context user:", user);
        console.log("🔍 DEBUG - Auth context loading:", isLoading);
        
        setSessionInfo({
          hasSession: !!session,
          sessionUser: session?.user || null,
          sessionError: error,
          accessToken: session?.access_token ? "Present" : "Missing",
          refreshToken: session?.refresh_token ? "Present" : "Missing",
        });

        if (session?.user) {
          addStep(`Session found for user: ${session.user.email}`);
          
          // Check if user exists in database
          addStep("Checking user in database...");
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (dbError) {
            addStep(`Database error: ${dbError.message}`);
            if (dbError.code === 'PGRST116') {
              addStep("User not found in database - this could cause auth issues!");
            }
          } else {
            addStep(`User found in database: ${dbUser?.display_name || 'No display name'}`);
            addStep(`Premium status: ${dbUser?.is_premium ? 'Yes' : 'No'}`);
            addStep(`Phone verified: ${dbUser?.phone_number ? 'Yes' : 'No'}`);
            setUserDbRecord(dbUser);
          }
        } else {
          addStep("No session found");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        addStep(`Exception during auth check: ${errorMsg}`);
        console.error("🔍 DEBUG - Exception:", err);
        setError(errorMsg);
      }
    };

    checkAuth();
  }, [user, isLoading]);

  // Test login function
  const testLogin = async (email: string, password: string) => {
    addStep(`Testing login for: ${email}`);
    try {
      setAuthSteps([]); // Clear previous steps
      addStep("Starting login process...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addStep(`Login error: ${error.message}`);
        return;
      }

      addStep("Login successful, checking user data...");
      
      if (data.user) {
        // Check database record
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (dbError) {
          addStep(`DB lookup error: ${dbError.message}`);
        } else {
          addStep(`DB user found: Premium=${dbUser?.is_premium}, Phone=${!!dbUser?.phone_number}`);
        }
      }
    } catch (err) {
      addStep(`Login exception: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  return (
    <div className="p-8 text-white bg-gray-950 min-h-screen max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Premium Account Auth Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auth Flow Steps */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-yellow-400">Auth Flow Steps</h2>
          <div className="max-h-64 overflow-y-auto bg-gray-800 p-3 rounded text-sm">
            {authSteps.map((step, i) => (
              <div key={i} className="mb-1 font-mono text-xs">
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Current Auth State */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-blue-400">Current Auth State</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Auth Loading:</strong> {isLoading ? "Yes" : "No"}</p>
            <p><strong>User exists:</strong> {user ? "Yes" : "No"}</p>
            {user && (
              <div className="mt-2 bg-gray-800 p-2 rounded">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Display Name:</strong> {(user as any)?.display_name || 'Not set'}</p>
                <p><strong>Premium:</strong> {(user as any)?.is_premium ? 'Yes' : 'No'}</p>
                <p><strong>Phone:</strong> {(user as any)?.phone_number || 'Not set'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Database User Record */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-green-400">Database User Record</h2>
          {userDbRecord ? (
            <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(userDbRecord, null, 2)}
            </pre>
          ) : (
            <p className="text-red-400">❌ No user record found in database!</p>
          )}
        </div>

        {/* Session Info */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-purple-400">Supabase Session</h2>
          {sessionInfo ? (
            <div className="space-y-2 text-sm">
              <p><strong>Has Session:</strong> {sessionInfo.hasSession ? "Yes" : "No"}</p>
              <p><strong>Access Token:</strong> {sessionInfo.accessToken}</p>
              <p><strong>Refresh Token:</strong> {sessionInfo.refreshToken}</p>
              {sessionInfo.sessionUser && (
                <div className="mt-2 bg-gray-800 p-2 rounded">
                  <p><strong>Session User ID:</strong> {sessionInfo.sessionUser.id}</p>
                  <p><strong>Session Email:</strong> {sessionInfo.sessionUser.email}</p>
                </div>
              )}
              {sessionInfo.sessionError && (
                <p className="text-red-400"><strong>Session Error:</strong> {sessionInfo.sessionError.message}</p>
              )}
            </div>
          ) : (
            <p className="text-yellow-400">Loading session info...</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-orange-400">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button 
              onClick={() => window.location.href = '/auth/login'} 
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
            >
              Go to Login
            </button>
            <button 
              onClick={() => window.location.href = '/my-events'} 
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
            >
              Go to My Events
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                addStep("Cleared local storage");
              }} 
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
            >
              Clear Storage
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Manual Login Test */}
        <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-pink-400">Test Login (Debug Mode)</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-gray-800 p-2 rounded text-sm"
                id="test-email"
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="bg-gray-800 p-2 rounded text-sm"
                id="test-password"
              />
              <button 
                onClick={() => {
                  const email = (document.getElementById('test-email') as HTMLInputElement)?.value;
                  const password = (document.getElementById('test-password') as HTMLInputElement)?.value;
                  if (email && password) {
                    testLogin(email, password);
                  }
                }}
                className="bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded text-sm"
              >
                Test Login
              </button>
            </div>
            <p className="text-xs text-gray-400">
              This will show detailed login steps without redirecting
            </p>
          </div>
        </div>

        {/* Error Info */}
        {error && (
          <div className="bg-red-900 p-4 rounded-lg lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3 text-red-400">Errors</h2>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 