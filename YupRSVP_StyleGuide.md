# Yup.RSVP Style Guide

## Overview

This style guide outlines the minimalistic design principles and implementation patterns used in the Yup.RSVP application. The application follows a clean, focused approach to UX/UI with an emphasis on typography, whitespace, and purposeful interactions. This document serves as a reference for maintaining consistency when extending the application or using it as a baseline for other projects.

## Design Philosophy

Yup.RSVP embraces a "less is more" philosophy with these core principles:

1. **Purposeful Minimalism**: Every element serves a clear purpose with no decorative clutter
2. **Focus on Content**: Typography and content hierarchy take precedence over decorative elements
3. **Intuitive Interactions**: Clear, predictable user flows with minimal cognitive load
4. **Brand Consistency**: Cohesive color palette and typography across all screens
5. **Responsive Design**: Clean, accessible layouts that adapt gracefully to all devices

## Color Palette

The application uses a restrained color palette to maintain focus and clarity:

### Primary Colors
- **Primary**: `#84793c` (Olive Gold) - Used for primary buttons, active states, and key actions
- **Background**: `#ffffff` (White) - Clean canvas for content
- **Text**: `#333333` (Dark Gray) - Primary text color for readability
- **Accent**: `#f8f5e6` (Light Cream) - For subtle highlights and secondary elements

### Secondary Colors
- **Success**: `#4caf50` (Green) - Confirmation messages, success states
- **Error**: `#f44336` (Red) - Error messages, destructive actions
- **Neutral**: `#e0e0e0` (Light Gray) - Borders, dividers, inactive states

### Implementation
Colors are defined in the theme configuration (theme.json) and accessed through Tailwind CSS classes or CSS variables for consistency.

## Typography

Typography is a key element of the minimalist design, with a focus on readability and hierarchy:

### Font Family
- **Primary Font**: Inter (sans-serif) - Used for all text
- **Fallback Fonts**: system-ui, -apple-system, sans-serif

### Type Scale
- **Display/Hero**: 2.5rem (40px) - Page titles, hero sections
- **Heading 1**: 2rem (32px) - Section titles
- **Heading 2**: 1.5rem (24px) - Card titles, modal headers
- **Heading 3**: 1.25rem (20px) - Subsection titles
- **Body**: 1rem (16px) - Main content text
- **Small/Caption**: 0.875rem (14px) - Secondary information, metadata

### Typography Rules
- Maintain a maximum of 3 font sizes per screen to preserve visual harmony
- Use font weight to create hierarchy (Regular 400, Medium 500, Bold 700)
- Line height: 1.5 for body text, 1.2 for headings
- Letter spacing: -0.01em for headings, normal for body text

## Spacing System

The application uses a consistent spacing system based on 4px increments:

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

Implemented through Tailwind's spacing utilities (p-4, m-2, gap-3, etc.)

## Component Design

### Buttons

Buttons follow a minimalist design with clear hierarchy:

#### Primary Button
- Solid background (Primary color)
- White text
- Subtle border radius (0.375rem)
- Padding: 0.5rem 1rem (py-2 px-4)
- Hover: Slightly darker shade
- Active: Inset shadow effect

#### Secondary Button
- Transparent background
- Primary color text and border
- Same dimensions as primary
- Hover: Light background

#### Tertiary/Text Button
- No background or border
- Primary color text
- Hover: Underline or slight background
- Used for less prominent actions

### Cards

Cards use subtle elevation and minimal styling:

- White background
- Light border OR subtle shadow (not both)
- Consistent padding (p-4 or p-6)
- Rounded corners (rounded-md)
- Clear content hierarchy with consistent spacing between elements

### Form Elements

Form elements emphasize clarity and usability:

- Input fields with minimal styling (border, no background)
- Clear labeling with consistent positioning (above inputs)
- Validation states with color indicators and helpful messages
- Consistent input height and padding
- Focus states with primary color highlights

## Page Layouts

The application uses a consistent layout structure across pages:

- **Header**: Minimal navigation with logo and essential actions
- **Content Area**: Clean white space with focused content
- **Container Width**: Max-width container (max-w-7xl) with responsive padding
- **Grid System**: Simple 12-column grid for complex layouts
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Animation and Interaction

Animations are subtle and purposeful:

- Transitions: 150ms-300ms duration with ease-in-out timing
- Hover effects: Subtle color changes, no dramatic movements
- Micro-interactions: Small-scale feedback for user actions
- Loading states: Simple, unobtrusive indicators

## Icons and Imagery

- **Icons**: From Lucide React library, used consistently at 20px (small) or 24px (standard)
- **Icon Treatment**: Monochromatic, using text color or primary color
- **Images**: Clean product photography on white/neutral backgrounds
- **Empty States**: Simple illustrations with clear messaging

## Implementation Patterns

### React Component Structure

Components follow a consistent structure:

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface CardProps {
  title: string;
  description?: string;
  onAction: () => void;
}

// 3. Component Definition
export function Card({ title, description, onAction }: CardProps) {
  // Local state/hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Helper functions
  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onAction();
  };
  
  // JSX with consistent className ordering
  return (
    <div className="rounded-md border p-4 shadow-sm">
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
      <Button onClick={handleClick} className="mt-4">
        {isExpanded ? 'Show Less' : 'Show More'}
      </Button>
    </div>
  );
}
```

### Tailwind Class Organization

Classes follow a consistent order:

1. Layout (flex, grid, position)
2. Box model (width, height, margin, padding)
3. Typography (text-*, font-*)
4. Visual (bg-*, border-*, shadow-*)
5. Interactive (hover:*, focus:*)
6. Responsive modifiers (sm:*, md:*, lg:*)

Example: `className="flex flex-col w-full p-4 text-sm text-gray-800 bg-white border rounded-md hover:border-primary sm:flex-row"`

## Accessibility Considerations

The minimalist design prioritizes accessibility:

- Color contrast ratio of at least 4.5:1 for text
- Focus indicators for keyboard navigation
- Semantic HTML elements
- ARIA attributes where necessary
- Touch targets minimum size of 44x44px
- Screen reader support for interactive elements

## Code Style Guidelines

### TypeScript

- Strong typing for all components and functions
- Use interfaces for object shapes
- Export types/interfaces for reuse
- Use discriminated unions for complex state

### React Conventions

- Functional components with hooks
- Component files match their exported name
- Co-locate related components in feature folders
- Extract reusable logic to custom hooks

### File Organization

```
/components
  /ui              # Base UI components (buttons, inputs)
  /[feature]       # Feature-specific components
/lib               # Utility functions, API handling
/hooks             # Custom React hooks
/contexts          # React context providers
/pages             # Route components
/types             # Shared TypeScript types
```

## Conclusion

This style guide embodies the minimalist philosophy of the Yup.RSVP application. By adhering to these principles, you can maintain design consistency and user experience quality when extending this application or using it as a foundation for new projects.

The minimalist approach values intentional design choices, focusing on what truly matters to users while eliminating unnecessary complexity and visual noise.