import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        
        <Skeleton className="w-full h-10" />
      </CardContent>
    </Card>
  );
}

export function EventCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}