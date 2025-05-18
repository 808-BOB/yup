import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginTest() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'subourbon',
          password: 'events'
        }),
      });
      
      const data = await response.json();
      setResponse(data);
      
      if (response.ok) {
        console.log("Direct login successful:", data);
      } else {
        setError(`Error: ${data.message || "Unknown error"}`);
        console.error("Direct login failed:", data);
      }
    } catch (error: any) {
      setError(`Error: ${error.message || "Unknown error"}`);
      console.error("Error during direct login:", error);
    } finally {
      setLoading(false);
    }
  };

  const testDbConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/users');
      const data = await response.json();
      setResponse(data);
    } catch (error: any) {
      setError(`Error: ${error.message || "Unknown error"}`);
      console.error("Error checking database:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Login Test Page</CardTitle>
          <CardDescription className="text-gray-400">Test the direct login functionality we fixed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={testDirectLogin}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Testing..." : "Test Direct Login"}
            </Button>
            <Button 
              onClick={testDbConnection}
              disabled={loading}
              variant="outline"
              className="border-gray-700"
            >
              {loading ? "Checking..." : "Check Database"}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {response && (
            <div className="mt-4 p-3 bg-gray-800 rounded-md">
              <p className="text-gray-400 text-sm mb-2">Response:</p>
              <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-gray-800 text-xs text-gray-500 flex justify-between">
          <span>Status: {loading ? "Testing..." : response ? "Complete" : "Ready"}</span>
          <a href="/" className="text-primary hover:text-primary/80">Back to home</a>
        </CardFooter>
      </Card>
    </div>
  );
}