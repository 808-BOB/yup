"use client";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export default function SetupStoragePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const setupStorage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setup-storage', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
      console.log('Setup result:', data);
    } catch (error) {
      console.error('Setup error:', error);
      setResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Storage Setup</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Storage Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={setupStorage} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? "Setting up..." : "Setup Storage Buckets"}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Setup Storage Buckets" to create the required buckets</li>
            <li>Check the result to see if buckets were created successfully</li>
            <li>If successful, go back to the profile page to test image upload</li>
            <li>If there are errors, check your Supabase configuration</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 