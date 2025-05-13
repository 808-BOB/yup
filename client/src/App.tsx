import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Event from "@/pages/event";
import CreateEvent from "@/pages/create-event";
import MyEvents from "@/pages/my-events";
import EventList from "@/pages/event-list";
import EventResponses from "@/pages/event-responses";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/profile";
import StyleGuide from "@/pages/style-guide";
import Branding from "@/pages/branding";
import Upgrade from "@/pages/upgrade";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import LinkedInTest from "@/pages/linkedin-test";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/event-list" component={EventList} />
      <Route path="/events/create" component={CreateEvent} />
      <Route path="/events/:slug/edit" component={CreateEvent} />
      {/* Support both slug and ID routes for responses */}
      <Route path="/events/:slug/responses" component={EventResponses} />
      <Route path="/events/:id/responses" component={EventResponses} />
      <Route path="/events/:slug" component={Event} />
      <Route path="/my-events" component={MyEvents} />
      <Route path="/profile" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/style-guide" component={StyleGuide} />
      <Route path="/branding" component={Branding} />
      <Route path="/upgrade" component={Upgrade} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/upgrade/success" component={SubscriptionSuccess} />
      <Route path="/linkedin-test" component={LinkedInTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
