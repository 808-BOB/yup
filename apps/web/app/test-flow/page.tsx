"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestFlow() {
  const [isFixingPolicies, setIsFixingPolicies] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const handleFixPolicies = async () => {
    setIsFixingPolicies(true);
    try {
      const response = await fetch('/api/storage/fix-event-policies', {
        method: 'POST',
      });
      
      const result = await response.json();
      setFixResult(result);
      console.log('Policy fix result:', result);
    } catch (error) {
      console.error('Error fixing policies:', error);
      setFixResult({ error: 'Failed to fix policies' });
    } finally {
      setIsFixingPolicies(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Flow - Storage Policy Fix</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Fix Storage Policies</h2>
            <p className="text-gray-400 mb-4">
              This will fix the RLS policies for the event-pics storage bucket to allow authenticated users to upload images.
            </p>
            
            <Button 
              onClick={handleFixPolicies} 
              disabled={isFixingPolicies}
              className="bg-primary hover:bg-primary/90"
            >
              {isFixingPolicies ? 'Fixing...' : 'Fix Storage Policies'}
            </Button>
          </div>

          {fixResult && (
            <div className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Policy Fix Results</h2>
              <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(fixResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 