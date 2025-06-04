import { useLocation } from "wouter";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";

type MainTab = "hosting" | "invited";
type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

// Legacy property names for backward compatibility
type LegacyTab = "your-events" | "invited";

interface ViewSelectorProps {
  // New property names
  activeMainTab?: MainTab;
  activeResponseFilter?: ResponseFilter;
  onMainTabChange?: (tab: MainTab) => void;
  onResponseFilterChange?: (filter: ResponseFilter) => void;

  // Legacy property names for backward compatibility
  activeTab?: LegacyTab;
  onTabChange?: (tab: LegacyTab) => void;
}

export default function ViewSelector({
  // New property names with defaults
  activeMainTab,
  activeResponseFilter = "all",
  onMainTabChange,
  onResponseFilterChange = () => {},

  // Legacy property names
  activeTab,
  onTabChange,
}: ViewSelectorProps) {
  const [, setLocation] = useLocation();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();

  // Convert legacy tab names to new tab names
  const derivedActiveMainTab = activeMainTab || (activeTab === "your-events" ? "hosting" : "invited");

  // Handle legacy or new tab changes
  const handleTabChange = (tab: MainTab) => {
    // Support the new property name if provided
    if (onMainTabChange) {
      onMainTabChange(tab);
    } 
    // Or fall back to legacy property
    else if (onTabChange) {
      const legacyTab: LegacyTab = tab === "hosting" ? "your-events" : "invited";
      onTabChange(legacyTab);
    }

    // Handle navigation regardless of which prop was used
    if (tab === "invited") {
      setLocation("/event-list");
    } else {
      setLocation("/my-events");
    }
  };
  
  // Handle archives view
  const handleViewArchives = () => {
    onResponseFilterChange("archives");
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-sm">
      {/* Main Tabs */}
      <div className="flex">
        <button
          onClick={() => handleTabChange("hosting")}
          className={`flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs ${
            derivedActiveMainTab === "hosting"
              ? "bg-gray-800 border-t-2"
              : "text-gray-500"
          }`}
          style={derivedActiveMainTab === "hosting" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderTopColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          Hosting
        </button>
        <button
          onClick={() => handleTabChange("invited")}
          className={`flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs ${
            derivedActiveMainTab === "invited"
              ? "bg-gray-800 border-t-2"
              : "text-gray-500"
          }`}
          style={derivedActiveMainTab === "invited" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderTopColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          Invited To
        </button>
      </div>

      {/* Response Filter Subtabs */}
      <div className="flex border-t border-gray-800 bg-gray-800/30">
        <button
          onClick={() => onResponseFilterChange("all")}
          className={`flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs ${
            activeResponseFilter === "all"
              ? "border-b"
              : "text-gray-500"
          }`}
          style={activeResponseFilter === "all" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderBottomColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          All
        </button>
        <button
          onClick={() => onResponseFilterChange("yup")}
          className={`flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs ${
            activeResponseFilter === "yup"
              ? "border-b"
              : "text-gray-500"
          }`}
          style={activeResponseFilter === "yup" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderBottomColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          Yup
        </button>
        <button
          onClick={() => onResponseFilterChange("nope")}
          className={`flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs ${
            activeResponseFilter === "nope"
              ? "border-b"
              : "text-gray-500"
          }`}
          style={activeResponseFilter === "nope" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderBottomColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          Nope
        </button>
        <button
          onClick={() => onResponseFilterChange("maybe")}
          className={`flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs ${
            activeResponseFilter === "maybe"
              ? "border-b"
              : "text-gray-500"
          }`}
          style={activeResponseFilter === "maybe" ? {
            color: primaryColor || 'hsl(308, 100%, 66%)',
            borderBottomColor: primaryColor || 'hsl(308, 100%, 66%)'
          } : {}}
        >
          Maybe
        </button>
      </div>
    </div>
  );
}