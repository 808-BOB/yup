import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import Footer from "@/components/footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";

// Immediate load components (critical path)
import Home from "@/pages/home";
import Login from "@/pages/login";

// Lazy load non-critical components
const NotFound = lazy(() => import("@/pages/not-found"));
const Event = lazy(() => import("@/pages/event"));
const CreateEvent = lazy(() => import("@/pages/create-event"));
const EditEvent = lazy(() => import("@/pages/edit-event"));
const MyEvents = lazy(() => import("@/pages/my-events"));
const EventList = lazy(() => import("@/pages/event-list"));
const EventResponses = lazy(() => import("@/pages/event-responses"));
const Signup = lazy(() => import("@/pages/signup"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const Profile = lazy(() => import("@/pages/profile"));
const StyleGuide = lazy(() => import("@/pages/style-guide"));
const Branding = lazy(() => import("@/pages/branding"));
const AdminDashboard = lazy(() => import("@/pages/admin"));
const Upgrade = lazy(() => import("@/pages/upgrade"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const SubscriptionSuccess = lazy(() => import("@/pages/subscription-success"));
const LinkedInTest = lazy(() => import("@/pages/linkedin-test"));
const LoginTest = lazy(() => import("@/pages/login-test"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex items-center gap-2 text-white">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/event-list">
        <Suspense fallback={<LoadingSpinner />}>
          <EventList />
        </Suspense>
      </Route>
      <Route path="/events/create">
        <Suspense fallback={<LoadingSpinner />}>
          <CreateEvent />
        </Suspense>
      </Route>
      <Route path="/events/:slug/edit">
        <Suspense fallback={<LoadingSpinner />}>
          <EditEvent />
        </Suspense>
      </Route>
      <Route path="/events/:slug/responses">
        <Suspense fallback={<LoadingSpinner />}>
          <EventResponses />
        </Suspense>
      </Route>
      <Route path="/events/:id/responses">
        <Suspense fallback={<LoadingSpinner />}>
          <EventResponses />
        </Suspense>
      </Route>
      <Route path="/events/:slug">
        <Suspense fallback={<LoadingSpinner />}>
          <Event />
        </Suspense>
      </Route>
      <Route path="/my-events">
        <Suspense fallback={<LoadingSpinner />}>
          <MyEvents />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/profile">
        <Suspense fallback={<LoadingSpinner />}>
          <Profile />
        </Suspense>
      </Route>
      <Route path="/signup">
        <Suspense fallback={<LoadingSpinner />}>
          <Signup />
        </Suspense>
      </Route>
      <Route path="/forgot-password">
        <Suspense fallback={<LoadingSpinner />}>
          <ForgotPassword />
        </Suspense>
      </Route>
      <Route path="/auth">
        <Suspense fallback={<LoadingSpinner />}>
          <AuthPage />
        </Suspense>
      </Route>
      <Route path="/style-guide">
        <Suspense fallback={<LoadingSpinner />}>
          <StyleGuide />
        </Suspense>
      </Route>
      <Route path="/branding">
        <Suspense fallback={<LoadingSpinner />}>
          <Branding />
        </Suspense>
      </Route>
      <Route path="/upgrade">
        <Suspense fallback={<LoadingSpinner />}>
          <Upgrade />
        </Suspense>
      </Route>
      <Route path="/subscribe">
        <Suspense fallback={<LoadingSpinner />}>
          <Subscribe />
        </Suspense>
      </Route>
      <Route path="/upgrade/success">
        <Suspense fallback={<LoadingSpinner />}>
          <SubscriptionSuccess />
        </Suspense>
      </Route>
      <Route path="/linkedin-test">
        <Suspense fallback={<LoadingSpinner />}>
          <LinkedInTest />
        </Suspense>
      </Route>
      <Route path="/login-test">
        <Suspense fallback={<LoadingSpinner />}>
          <LoginTest />
        </Suspense>
      </Route>
      <Route>
        <Suspense fallback={<LoadingSpinner />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrandingProvider>
            <div className="flex flex-col min-h-[100dvh] bg-gray-950">
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
              <Toaster />
            </div>
          </BrandingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
