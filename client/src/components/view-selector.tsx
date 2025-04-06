import { useLocation } from "wouter";

interface ViewSelectorProps {
  activeTab: "invited" | "your-events";
  onTabChange: (tab: "invited" | "your-events") => void;
}

export default function ViewSelector({
  activeTab,
  onTabChange,
}: ViewSelectorProps) {
  const [, setLocation] = useLocation();

  const handleTabChange = (tab: "invited" | "your-events") => {
    onTabChange(tab);

    if (tab === "invited") {
      setLocation("/event-list");
    } else {
      setLocation("/my-events");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-sm mb-6">
      <div className="flex">
        <button
          onClick={() => handleTabChange("your-events")}
          className={`flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs ${
            activeTab === "your-events"
              ? "text-primary bg-gray-800 border-t-2 border-primary"
              : "text-gray-500"
          }`}
        >
          Your Events
        </button>
        <button
          onClick={() => handleTabChange("invited")}
          className={`flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs ${
            activeTab === "invited"
              ? "text-primary bg-gray-800 border-t-2 border-primary"
              : "text-gray-500"
          }`}
        >
          Invited
        </button>
      </div>
    </div>
  );
}
