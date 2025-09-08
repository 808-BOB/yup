import * as React from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "./time-picker";
import { DatePicker } from "./date-picker";

export interface DateTimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, type, icon, value, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const getIcon = () => {
      if (icon) return icon;
      if (type === "date") return <Calendar className="h-4 w-4 text-white" />;
      if (type === "time") return <Clock className="h-4 w-4 text-white" />;
      return null;
    };

    const handleIconClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.showPicker?.();
      }
    };

    // For time inputs, use custom TimePicker
    if (type === "time") {
      const handleTimeChange = (timeValue: string) => {
        if (onChange) {
          // Create a synthetic event that React Hook Form expects
          const syntheticEvent = {
            target: {
              name: props.name || '',
              value: timeValue,
              type: 'time'
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      };

      return (
        <TimePicker
          value={value as string}
          onChange={handleTimeChange}
          className={className}
          disabled={props.disabled}
          placeholder={props.placeholder}
          use24Hour={false}
        />
      );
    }

    // For date inputs, use custom DatePicker
    if (type === "date") {
      const handleDateChange = (dateValue: string) => {
        if (onChange) {
          // Create a synthetic event that React Hook Form expects
          const syntheticEvent = {
            target: {
              name: props.name || '',
              value: dateValue,
              type: 'date'
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      };

      return (
        <DatePicker
          value={value as string}
          onChange={handleDateChange}
          className={className}
          disabled={props.disabled}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
        />
      );
    }

    // For other input types, use native input with custom styling
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 pr-10",
            className,
          )}
          ref={inputRef}
          value={value}
          onChange={onChange}
          suppressHydrationWarning
          {...props}
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleIconClick}
        >
          {getIcon()}
        </div>
      </div>
    );
  },
);
DateTimeInput.displayName = "DateTimeInput";

export { DateTimeInput }; 