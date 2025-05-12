import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SiLinkedin } from 'react-icons/si';
import { Users, User, RefreshCcw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

interface LinkedInConnection {
  id: number;
  displayName: string;
  linkedinProfileUrl: string;
  linkedinId: string;
  isConnected: boolean;
}

interface EventConnectionsProps {
  eventId: number;
}

export default function EventConnections({ eventId }: EventConnectionsProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // First check if the user is connected to LinkedIn
  const { data: linkedInStatus, isLoading: isStatusLoading } = useQuery<{ isConnected: boolean }>({
    queryKey: ['/api/auth/linkedin/status'],
  });

  // Fetch connections for this event
  const { 
    data: connections, 
    isLoading: isConnectionsLoading,
    refetch: refetchConnections
  } = useQuery<LinkedInConnection[]>({
    queryKey: [`/api/events/${eventId}/connections`],
    enabled: !!linkedInStatus?.isConnected,
  });

  const handleRefreshConnections = async () => {
    setIsRefreshing(true);
    try {
      await refetchConnections();
      toast({
        title: 'Connections Refreshed',
        description: 'LinkedIn connections have been refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh LinkedIn connections.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Not connected to LinkedIn
  if (!linkedInStatus?.isConnected) {
    return (
      <Card className="border border-gray-800 bg-gray-900 mb-6">
        <CardHeader>
          <CardTitle className="text-md flex items-center">
            <Users className="h-5 w-5 mr-2" />
            LinkedIn Connections
          </CardTitle>
          <CardDescription>
            See who you're connected to at this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Connect your LinkedIn account to see who you know at this event.
            </p>
            <Button 
              onClick={() => window.location.href = '/profile'} 
              className="w-full bg-[#0077b5] hover:bg-[#006097] text-white"
            >
              <SiLinkedin className="mr-2 h-4 w-4" />
              Set Up LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isStatusLoading || isConnectionsLoading) {
    return (
      <Card className="border border-gray-800 bg-gray-900 mb-6">
        <CardHeader>
          <CardTitle className="text-md flex items-center">
            <Users className="h-5 w-5 mr-2" />
            LinkedIn Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <p className="text-gray-400">Loading connections...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card className="border border-gray-800 bg-gray-900 mb-6">
        <CardHeader>
          <CardTitle className="text-md flex items-center">
            <Users className="h-5 w-5 mr-2" />
            LinkedIn Connections
          </CardTitle>
          <CardDescription>
            See who you're connected to at this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              No LinkedIn connections found at this event.
            </p>
            <Button
              onClick={handleRefreshConnections}
              disabled={isRefreshing}
              variant="outline"
              className="w-full bg-transparent border-gray-700 hover:bg-gray-800"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Connections'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-800 bg-gray-900 mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-md flex items-center">
            <Users className="h-5 w-5 mr-2" />
            LinkedIn Connections
          </CardTitle>
          <Badge className="bg-[#0077b5]">
            {connections.filter(c => c.isConnected).length} Connections
          </Badge>
        </div>
        <CardDescription>
          People you're connected to at this event
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {connections
              .filter(connection => connection.isConnected)
              .map((connection) => (
                <div 
                  key={connection.id} 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Avatar className="h-10 w-10 border border-gray-700 bg-gray-800">
                    <AvatarFallback className="bg-gray-800 text-gray-200">
                      {getInitials(connection.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{connection.displayName}</p>
                    <a 
                      href={connection.linkedinProfileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-primary flex items-center"
                    >
                      <SiLinkedin className="mr-1 h-3 w-3" />
                      View Profile
                    </a>
                  </div>
                </div>
              ))}
          </div>

          <Button
            onClick={handleRefreshConnections}
            disabled={isRefreshing}
            variant="outline"
            className="w-full mt-4 bg-transparent border-gray-700 hover:bg-gray-800"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Connections'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}