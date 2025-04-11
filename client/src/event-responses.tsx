// Test file for responses logic - to be deleted
import { useEffect } from 'react';
import { useParams } from 'wouter';

export default function TestResponsesPage() {
  const params = useParams();
  
  useEffect(() => {
    console.log("Test route params:", params);
  }, [params]);

  return (
    <div>
      <h1>Test Responses Page</h1>
      <p>Slug: {params.slug}</p>
    </div>
  );
}