"use client";

import { useState } from 'react';
import { Button } from '@/ui/button';
import { useAuth } from '@/utils/auth-context';

export default function CleanupSubscriptionsPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cleanupDuplicates = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/cleanup-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to cleanup subscriptions' });
    } finally {
      setLoading(false);
    }
  };

  const debugSubscriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/debug-subscriptions');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({ error: 'Failed to debug subscriptions' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Please log in to access this page</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cleanup Duplicate Subscriptions</h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">What this does:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Finds all active subscriptions for your account</li>
              <li>Keeps the highest priority subscription (Premium > Pro)</li>
              <li>Cancels all other duplicate subscriptions</li>
              <li>Updates your account to reflect the correct plan</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={debugSubscriptions} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Debugging...' : 'Debug Subscriptions First'}
            </Button>

            <Button 
              onClick={cleanupDuplicates} 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Cleaning up...' : 'Cleanup Duplicate Subscriptions'}
            </Button>
          </div>

          {debugData && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Debug Data:</h3>
              <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Cleanup Result:</h3>
              <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-12 p-6 bg-yellow-900/30 border border-yellow-700 rounded">
            <h3 className="text-lg font-semibold mb-2">⚠️ Important:</h3>
            <p className="text-yellow-200 text-sm">
              This will cancel duplicate subscriptions immediately. Make sure you want to proceed before clicking the button above.
              You'll keep your highest-tier subscription (Premium is kept over Pro).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
