import * as React from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateTimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, type, icon, ...props }, ref) => {
    const getIcon = () => {
      if (icon) return icon;
      if (type === "date") return <Calendar className="h-4 w-4 text-gray-400" />;
      if (type === "time") return <Clock className="h-4 w-4 text-gray-400" />;
      return null;
    };

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {getIcon()}
        </div>
      </div>
    );
  },
);
DateTimeInput.displayName = "DateTimeInput";

export { DateTimeInput }; 