import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the events list on the home page
    setLocation("/events");
  }, [setLocation]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector
        activeTab="invited"
        onTabChange={(tab) => {
          if (tab === "invited") {
            setLocation("/events");
          } else {
            setLocation("/my-events");
          }
        }}
      />
      {/* Content will be replaced by redirect */}
    </div>
  );
}
