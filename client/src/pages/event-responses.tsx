import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { type Event, type Response } from "@shared/schema";

export default function EventResponses() {
  const [, params] = useRoute("/events/:slug/responses");

  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: !!params?.slug,
    retry: 1
  });

  const { data: responses = [] } = useQuery<Response[]>({
    queryKey: [`/api/events/${event?.id}/responses`],
    enabled: !!event?.id
  });

  const { data: responseCounts = { yupCount: 0, nopeCount: 0 } } = useQuery<{yupCount: number, nopeCount: number}>({
    queryKey: [`/api/events/${event?.id}/responses/count`],
    enabled: !!event?.id
  });

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Event not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
      <Header />
      <main className="flex-1 overflow-auto animate-fade-in">
        <Card className="bg-gray-900 border border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">{event.title} RSVPs</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-800 p-4 rounded-sm">
                <div className="text-primary text-2xl font-bold mb-1">{responseCounts?.yupCount || 0}</div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Going</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-sm">
                <div className="text-gray-400 text-2xl font-bold mb-1">{responseCounts?.nopeCount || 0}</div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Not Going</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Going</h3>
                <div className="space-y-2">
                  {responses?.filter(r => r.response === 'yup').map((response) => (
                    <div key={response.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-sm">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-200">User {response.userId}</span>
                        <span className="text-xs text-gray-400">user{response.userId}@example.com</span>
                      </div>
                      <div className="text-xs text-primary font-medium uppercase">Yup</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Not Going</h3>
                <div className="space-y-2">
                  {responses?.filter(r => r.response === 'nope').map((response) => (
                    <div key={response.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-sm">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-200">User {response.userId}</span>
                        <span className="text-xs text-gray-400">user{response.userId}@example.com</span>
                      </div>
                      <div className="text-xs text-gray-400 font-medium uppercase">Nope</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}