import * as React from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface LocationAutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onLocationSelect?: (location: LocationSuggestion) => void;
  onAddressChange?: (address: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete = React.forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  ({ onLocationSelect, onAddressChange, placeholder = "Enter location", className, value, onChange, ...props }, ref) => {
    // Extract props that shouldn't be spread to the input
    const { onLocationSelect: _, onAddressChange: __, ...inputProps } = props;
    const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const searchPlaces = React.useCallback(async (query: string) => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/google/places/autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: query }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch place suggestions:', response.status, errorText);
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching place suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const getPlaceDetails = React.useCallback(async (placeId: string) => {
      try {
        const response = await fetch('/api/google/places/details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ placeId }),
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
      return null;
    }, []);

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Call the onChange prop for React Hook Form
      if (onChange) {
        onChange(e);
      }
    }, [onChange]);

    // Use useEffect for proper debouncing
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (value && value.length >= 2) {
          searchPlaces(value);
        } else {
          setSuggestions([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [value, searchPlaces]);

    const handleSuggestionClick = React.useCallback(async (suggestion: LocationSuggestion) => {
      setShowSuggestions(false);
      setSuggestions([]);

      // Use the structured format from Google Places API
      // mainText is the business name, secondaryText is the address
      const businessName = suggestion.mainText || suggestion.text;
      const address = suggestion.secondaryText || '';

      // Call onChange for React Hook Form with business name only
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: props.name || '',
            value: businessName,
            type: 'text'
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      // Set the address in the address field
      if (onAddressChange) {
        onAddressChange(address);
      }

      // Call onLocationSelect
      onLocationSelect?.(suggestion);

      // Try to get additional place details for more complete address, but don't fail if it doesn't work
      try {
        console.log('Getting place details for placeId:', suggestion.placeId);
        const placeDetails = await getPlaceDetails(suggestion.placeId);
        console.log('Place details received:', placeDetails);
        
        if (placeDetails && placeDetails.formattedAddress) {
          console.log('Using formatted address from place details:', placeDetails.formattedAddress);
          // Use the more complete address from place details if available
          onAddressChange?.(placeDetails.formattedAddress);
        } else {
          console.log('No formatted address from place details, using structured address:', address);
        }
      } catch (error) {
        console.warn('Failed to get place details, using structured address:', error);
        // Continue with the structured address
      }
    }, [getPlaceDetails, onLocationSelect, onAddressChange, onChange, props.name]);

    const handleInputFocus = React.useCallback(() => {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }, [suggestions.length]);

    const handleInputBlur = React.useCallback((e: React.FocusEvent) => {
      // Don't hide suggestions if clicking on a suggestion
      if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        return;
      }
      setShowSuggestions(false);
    }, []);

    // Handle clicks outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={suggestionsRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value || ""}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 pr-10",
              className,
            )}
            {...inputProps}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
            ) : (
              <MapPin className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.placeId}-${index}`}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none border-b border-gray-700 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {suggestion.mainText}
                    </div>
                    {suggestion.secondaryText && (
                      <div className="text-gray-400 text-sm truncate">
                        {suggestion.secondaryText}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

LocationAutocomplete.displayName = "LocationAutocomplete";

export { LocationAutocomplete };
