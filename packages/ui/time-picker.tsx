import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string; // Format: "HH:MM" (24-hour) or "HH:MM AM/PM" (12-hour)
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  use24Hour?: boolean;
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, onChange, className, disabled = false, placeholder = "--:-- --", use24Hour = false }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || "");
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Parse time value
    const parseTime = (timeStr: string) => {
      if (!timeStr) return { hours: 0, minutes: 0, period: 'AM' };
      
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return { hours: 0, minutes: 0, period: 'AM' };
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase() || 'AM';
      
      // Convert to 24-hour if needed
      if (!use24Hour && period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (!use24Hour && period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes, period };
    };

    // Format time value
    const formatTime = (hours: number, minutes: number, period: string) => {
      if (use24Hour) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    };

    const { hours, minutes, period } = parseTime(internalValue);
    const displayValue = internalValue || placeholder;

    // Generate options
    const hoursOptions = use24Hour 
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1);

    // Get display hours for 12-hour format comparison
    const getDisplayHours = (hours24: number) => {
      if (use24Hour) return hours24;
      return hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    };

    const displayHours = getDisplayHours(hours);
    
    const minutesOptions = Array.from({ length: 60 }, (_, i) => i);
    const periodOptions = ['AM', 'PM'];

    const handleTimeChange = (newHours: number, newMinutes: number, newPeriod: string) => {
      const formattedTime = formatTime(newHours, newMinutes, newPeriod);
      setInternalValue(formattedTime);
      onChange?.(formattedTime);
    };

    const handleHoursChange = (newHours: number) => {
      handleTimeChange(newHours, minutes, period);
    };

    const handleMinutesChange = (newMinutes: number) => {
      handleTimeChange(hours, newMinutes, period);
    };

    const handlePeriodChange = (newPeriod: string) => {
      handleTimeChange(hours, minutes, newPeriod);
    };

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Input Field */}
        <div
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 pr-10 cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          suppressHydrationWarning
        >
          <span className={cn(
            "flex-1 text-left",
            !internalValue && "text-muted-foreground"
          )}>
            {displayValue}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Clock className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg">
            <div className="flex p-2">
              {/* Hours Column */}
              <div className="flex-1">
                <div className="text-xs text-gray-400 text-center mb-2 font-medium">HOUR</div>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {hoursOptions.map((hour) => (
                    <button
                      key={hour}
                      className={cn(
                        "w-full py-2 px-3 text-sm text-center hover:bg-gray-800 transition-colors",
                        displayHours === hour && "bg-primary text-white"
                      )}
                      onClick={() => handleHoursChange(hour)}
                    >
                      {hour.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex-1">
                <div className="text-xs text-gray-400 text-center mb-2 font-medium">MIN</div>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {minutesOptions.map((minute) => (
                    <button
                      key={minute}
                      className={cn(
                        "w-full py-2 px-3 text-sm text-center hover:bg-gray-800 transition-colors",
                        minutes === minute && "bg-primary text-white"
                      )}
                      onClick={() => handleMinutesChange(minute)}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM Column (only for 12-hour format) */}
              {!use24Hour && (
                <div className="flex-1">
                  <div className="text-xs text-gray-400 text-center mb-2 font-medium">AM/PM</div>
                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {periodOptions.map((p) => (
                      <button
                        key={p}
                        className={cn(
                          "w-full py-2 px-3 text-sm text-center hover:bg-gray-800 transition-colors",
                          period === p && "bg-primary text-white"
                        )}
                        onClick={() => handlePeriodChange(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

TimePicker.displayName = "TimePicker";

export { TimePicker };
