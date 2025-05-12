import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LinkedInTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [urlInfo, setUrlInfo] = useState<{
    baseUrl: string | null;
    authorizeUrl: string | null;
    clientId: string | null;
    redirectUri: string | null;
  }>({
    baseUrl: null,
    authorizeUrl: null,
    clientId: null,
    redirectUri: null
  });

  useEffect(() => {
    // Get server config info on mount
    fetch('/api/auth/linkedin/config')
      .then(res => res.json())
      .then(data => {
        setUrlInfo(data);
      })
      .catch(err => {
        console.error("Failed to fetch LinkedIn config:", err);
      });
  }, []);

  const handleConnectManual = () => {
    if (urlInfo.authorizeUrl) {
      setIsLoading(true);
      window.location.href = urlInfo.authorizeUrl;
    }
  };

  const handleConnectNormal = () => {
    setIsLoading(true);
    window.location.href = '/auth/linkedin';
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">LinkedIn Connection Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>LinkedIn Configuration</CardTitle>
          <CardDescription>Current settings detected from server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Base URL:</strong> {urlInfo.baseUrl || "Loading..."}</div>
            <div><strong>Client ID Exists:</strong> {urlInfo.clientId ? "Yes" : "No"}</div>
            <div><strong>Redirect URI:</strong> {urlInfo.redirectUri || "Loading..."}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Standard Connection Method</CardTitle>
          <CardDescription>The normal way to connect via LinkedIn</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnectNormal}
            disabled={isLoading}
            className="w-full bg-[#0077b5] hover:bg-[#006097] text-white"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect with LinkedIn (Standard)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct Connection Method</CardTitle>
          <CardDescription>Connect directly to LinkedIn with configured URL</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnectManual}
            disabled={isLoading || !urlInfo.authorizeUrl}
            className="w-full bg-[#0077b5] hover:bg-[#006097] text-white"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect with LinkedIn (Direct)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}