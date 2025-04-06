import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the my-events page as the default view
    setLocation("/my-events");
  }, [setLocation]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector
        activeTab="your-events"
        onTabChange={(tab) => {
          if (tab === "invited") {
            setLocation("/event-list");
          } else {
            setLocation("/my-events");
          }
        }}
      />
      {/* Content will be replaced by redirect */}
    </div>
  );
}
