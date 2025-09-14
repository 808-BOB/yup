import { useRouter } from "next/navigation";
import { useBranding } from "@/contexts/BrandingContext";
import { useUnrespondedCount } from "@/utils/use-unresponded-count";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

type MainTab = "hosting" | "invited";
type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";
type HostingFilter = "upcoming" | "archived";

// Legacy property names for backward compatibility
type LegacyTab = "your-events" | "invited";

interface ViewSelectorProps {
  // New property names
  activeMainTab?: MainTab;
  activeResponseFilter?: ResponseFilter;
  activeHostingFilter?: HostingFilter;
  onMainTabChange?: (tab: MainTab) => void;
  onResponseFilterChange?: (filter: ResponseFilter) => void;
  onHostingFilterChange?: (filter: HostingFilter) => void;
  // Optional count of invited events with no response ("Maybe")
  invitedUnrespondedCount?: number;

  // Legacy property names for backward compatibility
  activeTab?: LegacyTab;
  onTabChange?: (tab: LegacyTab) => void;
}

export default function ViewSelector({
  // New property names with defaults
  activeMainTab,
  activeResponseFilter = "all",
  activeHostingFilter = "upcoming",
  onMainTabChange,
  onResponseFilterChange = () => {},
  onHostingFilterChange = () => {},
  invitedUnrespondedCount,

  // Legacy property names
  activeTab,
  onTabChange,
}: ViewSelectorProps) {
  const router = useRouter();
  const branding = useBranding();
  // Prefer caller-provided count; fallback to hook-based count when not provided
  const { count: hookCount } = useUnrespondedCount();
  const unrespondedCount =
    typeof invitedUnrespondedCount === 'number' ? invitedUnrespondedCount : hookCount;

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

    // Handle navigation
    if (tab === "invited") {
      router.push("/event-list");
    } else {
      router.push("/my-events");
    }
  };

  return (
    <div
      className="border rounded-sm"
      style={{
        backgroundColor: branding.theme.secondary + 'F2', // 95% opacity
        borderColor: branding.theme.primary + '33' // 20% opacity
      }}
    >
      {/* Main Tabs */}
      <div className="flex">
        <button
          onClick={() => handleTabChange("hosting")}
          className="flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs border-t-2"
          style={{
            backgroundColor: derivedActiveMainTab === "hosting" ? branding.theme.primary : 'transparent',
            color: derivedActiveMainTab === "hosting" ? getContrastingTextColor(branding.theme.primary) : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
            borderTopColor: derivedActiveMainTab === "hosting" ? branding.theme.primary : 'transparent'
          }}
        >
          Hosting
        </button>
        <button
          onClick={() => handleTabChange("invited")}
          className="flex-1 py-2 px-4 rounded-sm font-bold text-center uppercase tracking-wider text-xs border-t-2"
          style={{
            backgroundColor: derivedActiveMainTab === "invited" ? branding.theme.primary : 'transparent',
            color: derivedActiveMainTab === "invited" ? getContrastingTextColor(branding.theme.primary) : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
            borderTopColor: derivedActiveMainTab === "invited" ? branding.theme.primary : 'transparent'
          }}
        >
          {`Invited To (${unrespondedCount > 99 ? '99+' : unrespondedCount})`}
        </button>
      </div>

      {/* Hosting Filter Subtabs - Only show when on "hosting" tab */}
      {derivedActiveMainTab === "hosting" && (
        <div
          className="flex border-t"
          style={{
            borderTopColor: branding.theme.primary + '33', // 20% opacity
            backgroundColor: branding.theme.secondary + 'CC' // 80% opacity
          }}
        >
          <button
            onClick={() => onHostingFilterChange("upcoming")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeHostingFilter === "upcoming" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeHostingFilter === "upcoming" ? branding.theme.primary : 'transparent'
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => onHostingFilterChange("archived")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeHostingFilter === "archived" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeHostingFilter === "archived" ? branding.theme.primary : 'transparent'
            }}
          >
            Complete
          </button>
        </div>
      )}

      {/* Response Filter Subtabs - Only show when on "invited" tab */}
      {derivedActiveMainTab === "invited" && (
        <div
          className="flex border-t"
          style={{
            borderTopColor: branding.theme.primary + '33', // 20% opacity
            backgroundColor: branding.theme.secondary + 'CC' // 80% opacity
          }}
        >
          <button
            onClick={() => onResponseFilterChange("all")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeResponseFilter === "all" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeResponseFilter === "all" ? branding.theme.primary : 'transparent'
            }}
          >
            All
          </button>
          <button
            onClick={() => onResponseFilterChange("yup")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeResponseFilter === "yup" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeResponseFilter === "yup" ? branding.theme.primary : 'transparent'
            }}
          >
            Yup
          </button>
          <button
            onClick={() => onResponseFilterChange("nope")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeResponseFilter === "nope" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeResponseFilter === "nope" ? branding.theme.primary : 'transparent'
            }}
          >
            Nope
          </button>
          <button
            onClick={() => onResponseFilterChange("maybe")}
            className="flex-1 py-1 px-2 font-medium text-center uppercase tracking-wider text-xs border-b-2"
            style={{
              color: activeResponseFilter === "maybe" ? branding.theme.primary : getContrastingTextColor(branding.theme.secondary) + 'CC', // 80% opacity
              borderBottomColor: activeResponseFilter === "maybe" ? branding.theme.primary : 'transparent'
            }}
          >
            Maybe
          </button>
        </div>
      )}
    </div>
  );
}
