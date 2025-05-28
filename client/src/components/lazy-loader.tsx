import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex items-center gap-2 text-white">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

// Lazy-loaded components
export const LazyEventList = lazy(() => import("@/pages/event-list"));
export const LazyEventDetail = lazy(() => import("@/pages/event"));
export const LazyCreateEvent = lazy(() => import("@/pages/create-event"));
export const LazyMyEvents = lazy(() => import("@/pages/my-events"));
export const LazyEventResponses = lazy(() => import("@/pages/event-responses"));
export const LazyAdmin = lazy(() => import("@/pages/admin"));
export const LazyProfile = lazy(() => import("@/pages/profile"));
export const LazyPlans = lazy(() => import("@/pages/plans"));
export const LazyBranding = lazy(() => import("@/pages/branding"));

// Wrapper component with Suspense
export const LazyComponent = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);