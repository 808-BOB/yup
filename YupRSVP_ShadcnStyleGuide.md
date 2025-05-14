# Yup.RSVP ShadCN Integration Style Guide

This guide outlines how Yup.RSVP integrates and customizes the ShadCN UI component library with Tailwind CSS to achieve its minimalist design system. Use this as a reference for maintaining consistency when extending this application or as a starting point for other projects.

## 1. ShadCN Setup & Customization

### Integration Approach

Yup.RSVP uses ShadCN for its component library with the following customization approach:

1. **Component Installation**: Only install needed components rather than the entire library
2. **Theme Customization**: Override default theme using `theme.json` and custom Tailwind configuration
3. **Component Extension**: Extend ShadCN components with application-specific styling
4. **Consistent Imports**: Use the `@/components/ui` path alias for all ShadCN components

### Theme Configuration

In Yup.RSVP, we customize ShadCN's theme using `theme.json` with the following structure:

```json
{
  "primary": "#84793c",
  "variant": "professional",
  "appearance": "light",
  "radius": 0.375
}
```

- **primary**: The brand color (Olive Gold)
- **variant**: Professional mode for subdued color variations
- **appearance**: Light mode is default (dark mode supported but not implemented)
- **radius**: Rounded corners with a moderate radius of 0.375rem

### Tailwind Extension

The application extends the Tailwind configuration to work with ShadCN components:

```js
// tailwind.config.ts
import { withShadcnTheme } from '@replit/vite-plugin-shadcn-theme-json';
import type { Config } from 'tailwindcss';

export default withShadcnTheme({
  content: [
    "./client/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom font configuration
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Extended color palette beyond ShadCN defaults
      colors: {
        // Custom color shades for specific application needs
        accent: {
          light: '#f8f5e6',
        },
        success: {
          DEFAULT: '#4caf50',
          light: '#a5d6a7',
          dark: '#388e3c',
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}) satisfies Config;
```

## 2. Component Usage Patterns

### Component Extension Pattern

In Yup.RSVP, we extend ShadCN components with application-specific styling using this pattern:

```tsx
// Button extension example in client/src/components/ui-extended/primary-button.tsx

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonProps {
  fullWidth?: boolean;
}

export function PrimaryButton({ 
  className, 
  fullWidth = false, 
  children, 
  ...props 
}: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        "bg-primary text-white hover:bg-primary-600 focus:ring-primary-200",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
```

### Form Pattern

Yup.RSVP's approach to forms using ShadCN components:

```tsx
// Form pattern using ShadCN components
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Form schema using Zod
const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().optional(),
});

export function EventForm() {
  // Initialize react-hook-form with zodResolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Form submission logic
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormDescription>
                This will be the displayed name of your event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More form fields */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Layout Component Pattern

Consistent layout component pattern in Yup.RSVP:

```tsx
// client/src/components/ui-extended/card-container.tsx
import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContainer({ children, className }: CardContainerProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
```

## 3. ShadCN Components & Customizations

### Customized Component List

Below are the ShadCN components used in Yup.RSVP with their customizations:

#### Button

```tsx
// Added variants:
// - brand: Olive Gold background with white text
// - outline-brand: White background with Olive Gold border and text
// - ghost-brand: Transparent background with Olive Gold text
// - link-brand: No background or border, just Olive Gold text with underline on hover
```

#### Form Components

```tsx
// Form styling customizations:
// - Reduced form field spacing from 8 to 6
// - Customized focus states to use primary color
// - Added subtle transitions for focus interactions
// - Used consistent sizing with the rest of the UI
```

#### Card

```tsx
// Card customizations:
// - Lighter shadow (shadow-sm instead of shadow-md)
// - Added subtle hover state with shadow-md
// - Consistent internal padding (p-6)
// - Limited border to only appear on light backgrounds
```

#### Dialog/Modal

```tsx
// Dialog/Modal customizations:
// - Increased backdrop transparency for a lighter feel
// - Reduced shadow intensity on the dialog container
// - Added subtle animation for dialog appearance
// - Simplified close button to be less prominent
```

#### Toast

```tsx
// Toast customizations:
// - Positioned in the bottom-right instead of top-right
// - Duration reduced to 4000ms (4 seconds)
// - Added subtle slide-in and fade animations
// - Used more subdued colors with the primary brand color
```

## 4. Multi-Step Form Implementation

Yup.RSVP implements a multi-step form pattern for event creation:

```tsx
// Multi-step form pattern with ShadCN
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Step indicators component
function FormSteps({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1 rounded-full flex-1 transition-colors",
            index < currentStep ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const totalSteps = 3;
  
  // Form state
  const [formData, setFormData] = useState({
    // Form data structure
  });
  
  // Steps content definition
  const steps = [
    {
      title: "Basic Information",
      component: <Step1Form data={formData} updateData={setFormData} />
    },
    {
      title: "Event Details",
      component: <Step2Form data={formData} updateData={setFormData} />
    },
    {
      title: "Review & Create",
      component: <Step3Form data={formData} updateData={setFormData} />
    }
  ];
  
  // Navigation handlers
  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));
  
  // Submit handler
  const handleSubmit = () => {
    // Final submission logic
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{steps[step].title}</CardTitle>
        <FormSteps currentStep={step} totalSteps={totalSteps} />
      </CardHeader>
      
      <CardContent>
        {steps[step].component}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={step === 0}
        >
          Previous
        </Button>
        
        {step < totalSteps - 1 ? (
          <Button onClick={nextStep}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Create Event</Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

## 5. Page Layout Patterns

### Standard Page Layout

```tsx
// Standard page layout pattern
export function StandardPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

### Split Page Layout (Auth Pages)

```tsx
// Split page layout for authentication
export function AuthPageLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Form section - 40% width on desktop */}
      <div className="w-full lg:w-2/5 p-8 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full">
          {/* Form content */}
        </div>
      </div>
      
      {/* Hero section - 60% width on desktop, hidden on mobile */}
      <div className="hidden lg:block lg:w-3/5 bg-primary-50">
        <div className="h-full flex flex-col items-center justify-center p-8">
          {/* Hero content */}
        </div>
      </div>
    </div>
  );
}
```

### Dashboard Layout

```tsx
// Dashboard layout pattern
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - 1/4 width on desktop */}
          <div className="md:col-span-1">
            <Sidebar />
          </div>
          
          {/* Main content - 3/4 width on desktop */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
```

## 6. Responsive Design Patterns

### Mobile-First Approach

Yup.RSVP follows a mobile-first approach with consistent breakpoints:

```css
/* Breakpoint usage pattern */
.element {
  /* Mobile styles (default) */
  padding: 1rem;
  
  /* Tablet (640px and up) */
  @media (min-width: 640px) {
    padding: 1.5rem;
  }
  
  /* Laptop (1024px and up) */
  @media (min-width: 1024px) {
    padding: 2rem;
  }
  
  /* Desktop (1280px and up) */
  @media (min-width: 1280px) {
    padding: 2.5rem;
  }
}
```

### Responsive Grid System

```tsx
// Responsive grid pattern for cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

### Responsive Typography

```css
/* Responsive typography pattern */
.page-title {
  @apply text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight;
}

.section-title {
  @apply text-xl font-semibold md:text-2xl tracking-tight;
}

.card-title {
  @apply text-lg font-medium md:text-xl;
}
```

## 7. Animation & Interaction Patterns

### Transition Patterns

```css
/* Common transition patterns */
.hover-card {
  @apply transition-shadow duration-200 hover:shadow-md;
}

.form-element {
  @apply transition-all duration-150 focus:ring-2 focus:ring-primary/20;
}

.button-hover {
  @apply transition-colors duration-200;
}
```

### Page Transitions

```tsx
// Page transition pattern
import { motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

## 8. Best Practices & Guidelines

### Component Hierarchy

```
/components
  /ui               # ShadCN base components
  /ui-extended      # Application-specific extended components
  /layout           # Layout components (page structures, containers)
  /forms            # Form-specific components
  /[feature]        # Feature-specific components
```

### Naming Conventions

- **Base components**: Use ShadCN's naming (Button, Card, Dialog)
- **Extended components**: Add descriptive prefix/suffix (PrimaryButton, CardContainer)
- **Feature components**: Use feature-first naming (EventCard, UserAvatar)

### Class Organization Pattern

Use the `cn` utility for className merging with this ordering:

1. Base/layout styles
2. Sizing and spacing
3. Typography
4. Colors and backgrounds
5. Borders and shadows
6. States (hover, focus, etc.)
7. Responsive modifiers
8. Passed className (always last for overrides)

```tsx
<div
  className={cn(
    // 1. Base/layout
    "flex flex-col",
    // 2. Sizing/spacing
    "w-full p-4 gap-2",
    // 3. Typography
    "text-sm font-medium",
    // 4. Colors
    "bg-white text-neutral-800",
    // 5. Borders/shadows
    "rounded-md border border-neutral-200 shadow-sm",
    // 6. States
    "hover:shadow-md focus:ring-2 focus:ring-primary/20",
    // 7. Responsive
    "sm:p-6 md:flex-row",
    // 8. External className
    className
  )}
/>
```

### Common Component Extensions

```tsx
// Common component extension pattern
function withTooltip<T extends React.ElementType>(Component: T) {
  return function WithTooltip({ 
    tooltipContent, 
    tooltipSide = "top",
    ...props 
  }: { 
    tooltipContent: React.ReactNode;
    tooltipSide?: "top" | "right" | "bottom" | "left"; 
  } & React.ComponentPropsWithoutRef<T>) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Component {...props} />
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
}

// Usage
const ButtonWithTooltip = withTooltip(Button);
```

## 9. Implementation Examples

### Event Card Component Example

```tsx
// client/src/components/events/event-card.tsx
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md h-full flex flex-col",
        className
      )}
    >
      {event.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex flex-col space-y-1">
          <h3 className="font-medium text-lg text-foreground line-clamp-2">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
          </p>
          {event.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {event.location}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {event.description || "No description provided."}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2">
        {event.isPrivate ? (
          <Badge variant="outline" className="text-xs">Private</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Public</Badge>
        )}
        <Button size="sm" variant="default">View Event</Button>
      </CardFooter>
    </Card>
  );
}
```

### Minimalist Form Field Example

```tsx
// client/src/components/forms/text-field.tsx
import { forwardRef } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      name,
      label,
      description,
      placeholder,
      type = "text",
      required = false,
      className,
      labelClassName,
      inputClassName,
    },
    ref
  ) {
    const form = useFormContext();
    
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className={cn("space-y-1.5", className)}>
            {label && (
              <FormLabel className={cn("text-sm font-medium", labelClassName)}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Input
                placeholder={placeholder}
                type={type}
                className={inputClassName}
                ref={ref}
                {...field}
              />
            </FormControl>
            {description && (
              <FormDescription className="text-xs">
                {description}
              </FormDescription>
            )}
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    );
  }
);
```

## 10. Moving Forward

### Extending the System

When extending Yup.RSVP's UI system, follow these guidelines:

1. **Component Extension Strategy**:
   - First, use ShadCN components directly with Tailwind classes
   - If a component pattern is repeated 3+ times, create an extended component
   - Keep application-specific styling in the extended components
   
2. **Theme Modification Process**:
   - Update `theme.json` for global color and radius changes
   - Extend the Tailwind config for more specific customizations
   - Document component-specific modifications with comments

3. **Consistency Checklist**:
   - Typography scales maintained across all components
   - Spacing follows the established 4px grid
   - Transitions and animations use consistent timing
   - Component variants follow naming conventions

By following this guide, you'll maintain the minimalist, cohesive visual language of Yup.RSVP while extending its functionality in a structured, maintainable way.