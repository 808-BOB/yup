import { useState } from "react";
import { useLocation } from "wouter";

interface ViewSelectorProps {
  activeTab: "invited" | "your-events";
  onTabChange: (tab: "invited" | "your-events") => void;
}

export default function ViewSelector({ activeTab, onTabChange }: ViewSelectorProps) {
  const [, setLocation] = useLocation();

  const handleTabChange = (tab: "invited" | "your-events") => {
    onTabChange(tab);
    
    if (tab === "invited") {
      setLocation("/events");
    } else {
      setLocation("/my-events");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-1">
      <div className="flex">
        <button 
          onClick={() => handleTabChange("invited")}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-center ${
            activeTab === "invited" 
              ? "text-primary bg-blue-50 dark:bg-blue-900/30" 
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Invited
        </button>
        <button 
          onClick={() => handleTabChange("your-events")}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-center ${
            activeTab === "your-events" 
              ? "text-primary bg-blue-50 dark:bg-blue-900/30" 
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Your Events
        </button>
      </div>
    </div>
  );
}
