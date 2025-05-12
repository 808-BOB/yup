import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { SiLinkedin } from 'react-icons/si';

interface LinkedInUser {
  id: string;
  displayName: string;
  linkedinProfileUrl: string;
}

export default function LinkedInConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user is connected to LinkedIn
  const { data: linkedInStatus, isLoading, error } = useQuery<{ isConnected: boolean, profile?: LinkedInUser }>({
    queryKey: ['/api/auth/linkedin/status'],
  });
  
  // Handle errors from the query
  if (error) {
    console.error('Error fetching LinkedIn status:', error);
    toast({
      title: 'Connection Error',
      description: 'Unable to check LinkedIn connection status.',
      variant: 'destructive',
    });
  }

  // Handler for connecting to LinkedIn
  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);
    try {
      // Open LinkedIn OAuth flow in a new window
      window.location.href = '/auth/linkedin';
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to LinkedIn. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handler for disconnecting from LinkedIn
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/linkedin/disconnect', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Disconnected',
        description: 'Your LinkedIn account has been disconnected.',
      });
      // Force refetch of LinkedIn status
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: 'Disconnection Failed',
        description: 'Unable to disconnect from LinkedIn. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Button 
        disabled 
        className="w-full bg-gray-800 hover:bg-gray-700"
      >
        <SiLinkedin className="mr-2 h-4 w-4" />
        Checking LinkedIn status...
      </Button>
    );
  }

  if (linkedInStatus && linkedInStatus.isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex-1">
            <p className="font-medium">Connected as {linkedInStatus.profile?.displayName}</p>
            <p className="text-xs text-gray-400">
              <a 
                href={linkedInStatus.profile?.linkedinProfileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View Profile
              </a>
            </p>
          </div>
          <div className="h-6 w-6 rounded-full flex items-center justify-center bg-primary/20">
            <SiLinkedin className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isPending}
          className="w-full bg-transparent border-gray-700 hover:bg-gray-800"
        >
          {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect LinkedIn"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnectLinkedIn}
      disabled={isConnecting}
      className="w-full bg-[#0077b5] hover:bg-[#006097] text-white"
    >
      <SiLinkedin className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect with LinkedIn"}
    </Button>
  );
}