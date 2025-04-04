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
import { AuthProvider } from "@/contexts/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events" component={EventList} />
      <Route path="/events/create" component={CreateEvent} />
      <Route path="/events/:slug" component={Event} />
      <Route path="/events/:slug/responses" component={EventResponses} />
      <Route path="/my-events" component={MyEvents} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-950">
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
