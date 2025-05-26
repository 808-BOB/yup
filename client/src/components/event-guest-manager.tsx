import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Edit, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GuestManagerProps {
  eventId: string;
  isHost: boolean;
}

interface Response {
  id: number;
  userId?: string;
  response: "yup" | "nope" | "maybe";
  isGuest: boolean;
  guestName?: string;
  guestEmail?: string;
  guestCount: number;
  createdAt: string;
}

export default function EventGuestManager({ eventId, isHost }: GuestManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingResponse, setEditingResponse] = useState<number | null>(null);

  // Fetch all responses for the event
  const { data: responses, isLoading } = useQuery<Response[]>({
    queryKey: ["/api/responses", eventId],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/responses`),
    enabled: isHost,
  });

  // Mutation to update a response
  const updateResponseMutation = useMutation({
    mutationFn: async ({ responseId, newResponse }: { responseId: number; newResponse: string }) => {
      return apiRequest("PATCH", `/api/responses/${responseId}`, {
        response: newResponse,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responses", eventId] });
      setEditingResponse(null);
      toast({
        title: "Response Updated",
        description: "The RSVP response has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the response. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isHost) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Guest List Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Loading responses...</p>
        </CardContent>
      </Card>
    );
  }

  const getResponseColor = (response: string) => {
    switch (response) {
      case "yup":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "nope":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "maybe":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          Guest List Management
          <Badge variant="outline" className="ml-auto">
            {responses?.length || 0} responses
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {responses?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No responses yet</p>
          ) : (
            responses?.map((response) => (
              <div
                key={response.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white font-medium">
                      {response.isGuest ? response.guestName : `User ${response.userId}`}
                    </p>
                    {response.guestEmail && (
                      <p className="text-gray-400 text-sm">{response.guestEmail}</p>
                    )}
                    {response.guestCount > 0 && (
                      <p className="text-gray-400 text-sm">+{response.guestCount} guests</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingResponse === response.id ? (
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={response.response}
                        onValueChange={(value) => {
                          updateResponseMutation.mutate({
                            responseId: response.id,
                            newResponse: value,
                          });
                        }}
                      >
                        <SelectTrigger className="w-24 bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yup">Yup</SelectItem>
                          <SelectItem value="nope">Nope</SelectItem>
                          <SelectItem value="maybe">Maybe</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingResponse(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className={getResponseColor(response.response)}>
                        {response.response}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingResponse(response.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}