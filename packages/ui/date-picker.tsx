import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // Format: "YYYY-MM-DD"
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, className, disabled = false, placeholder = "mm/dd/yyyy", min, max }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || "");
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Parse date value
    const parseDate = (dateStr: string) => {
      if (!dateStr) {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      }
      
      // Parse the date string directly to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      // console.log('DatePicker: Parsing date', { dateStr, year, month, day });
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      }
      
      return { year, month, day };
    };

    // Format date value
    const formatDate = (year: number, month: number, day: number) => {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    // Format display date
    const formatDisplayDate = (dateStr: string) => {
      if (!dateStr) return placeholder;
      
      // Parse the date string directly to avoid timezone issues
      const parts = dateStr.split('-');
      if (parts.length !== 3) return placeholder;
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) return placeholder;
      
      // Create date in local timezone to avoid UTC conversion
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return placeholder;
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    };

    const { year, month, day } = parseDate(internalValue);
    const displayValue = formatDisplayDate(internalValue);

    // Generate calendar data
    const getDaysInMonth = (year: number, month: number) => {
      // month is 1-based, so we need to use month (not month-1) for the next month
      // new Date(year, month, 0) gives us the last day of the previous month
      // which is actually the last day of the current month we want
      return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      // Use local date to avoid timezone issues
      return new Date(year, month - 1, 1).getDay();
    };

    const getMonthName = (month: number) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[month - 1];
    };

    const getDaysArray = (year: number, month: number) => {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }
      
      return days;
    };

    const handleDateChange = (newYear: number, newMonth: number, newDay: number) => {
      const formattedDate = formatDate(newYear, newMonth, newDay);
      console.log('DatePicker: Selected date', { newYear, newMonth, newDay, formattedDate });
      setInternalValue(formattedDate);
      onChange?.(formattedDate);
      setIsOpen(false);
    };

    const handlePrevMonth = () => {
      const newMonth = month === 1 ? 12 : month - 1;
      const newYear = month === 1 ? year - 1 : year;
      // Keep the same day if possible, otherwise use the last day of the month
      const daysInNewMonth = getDaysInMonth(newYear, newMonth);
      const newDay = Math.min(day, daysInNewMonth);
      handleDateChange(newYear, newMonth, newDay);
    };

    const handleNextMonth = () => {
      const newMonth = month === 12 ? 1 : month + 1;
      const newYear = month === 12 ? year + 1 : year;
      // Keep the same day if possible, otherwise use the last day of the month
      const daysInNewMonth = getDaysInMonth(newYear, newMonth);
      const newDay = Math.min(day, daysInNewMonth);
      handleDateChange(newYear, newMonth, newDay);
    };

    const isToday = (dayNum: number) => {
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      
      return year === todayYear && 
             month === todayMonth && 
             dayNum === todayDay;
    };

    const isSelected = (dayNum: number) => {
      return day === dayNum;
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

    const days = getDaysArray(year, month);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Debug: Log the calendar data
    // console.log('DatePicker: Calendar data', { 
    //   year, 
    //   month, 
    //   day, 
    //   daysInMonth: getDaysInMonth(year, month),
    //   firstDay: getFirstDayOfMonth(year, month),
    //   days: days.filter(d => d !== null),
    //   fullDaysArray: days
    // });

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
            <Calendar className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Calendar Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-80 bg-gray-900 border border-gray-700 rounded-md shadow-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-white font-medium">
                {getMonthName(month)} {year}
              </h3>
              
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((dayName) => (
                <div key={dayName} className="text-xs text-gray-400 text-center py-2 font-medium">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayNum, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-8 w-8 text-sm rounded transition-colors flex items-center justify-center",
                    !dayNum && "invisible", // Empty cells
                    dayNum && "hover:bg-gray-800 text-white",
                    isToday(dayNum!) && "ring-2 ring-primary ring-opacity-50",
                    isSelected(dayNum!) && "bg-primary text-white"
                  )}
                  onClick={() => {
                    if (dayNum) {
                      console.log('DatePicker: Clicked day', { 
                        dayNum, 
                        year, 
                        month, 
                        currentDay: day,
                        position: `Row ${Math.floor(index / 7) + 1}, Col ${(index % 7) + 1}`
                      });
                      handleDateChange(year, month, dayNum);
                    }
                  }}
                  disabled={!dayNum}
                >
                  {dayNum}
                </button>
              ))}
            </div>

            {/* Today Button */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => {
                  const today = new Date();
                  const todayYear = today.getFullYear();
                  const todayMonth = today.getMonth() + 1;
                  const todayDay = today.getDate();
                  handleDateChange(todayYear, todayMonth, todayDay);
                }}
                className="w-full text-sm text-gray-300 hover:text-white transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
