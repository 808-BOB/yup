# Minimalist UI System

This document outlines a clean, minimalist design system that can be integrated into any application. It's based on the principles seen in Yup.RSVP but generalized for broader use.

## Core Design Principles

- **Essential Elements Only**: Include only what serves a purpose
- **Content-First Design**: Typography and content hierarchy as the foundation
- **Whitespace as a Design Element**: Strategic use of negative space
- **Consistent Visual Language**: Limited color palette and consistent spacing
- **Progressive Disclosure**: Show information only when needed

## Design Tokens

### Colors

```typescript
const colors = {
  primary: {
    // Your brand color (Olive Gold example from Yup.RSVP)
    DEFAULT: '#84793c',
    light: '#a59e6a',
    dark: '#635a2d',
    // Scale for UI components
    50: '#f8f7f0',
    100: '#f0ede0',
    200: '#e0dbc1',
    300: '#ccc59f',
    400: '#b3a97a',
    500: '#84793c', // Primary
    600: '#756a35',
    700: '#635a2d',
    800: '#4a4321',
    900: '#343018',
  },
  neutral: {
    // Neutral colors for text, backgrounds, borders
    50: '#f9f9f9',
    100: '#f0f0f0',
    200: '#e4e4e4',
    300: '#d1d1d1',
    400: '#b4b4b4',
    500: '#939393',
    600: '#6d6d6d',
    700: '#4F4F4F',
    800: '#333333', // Primary text
    900: '#191919',
  },
  // Success, Error, Warning states
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
}
```

### Typography

```typescript
const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  // Consistent scale with 1.25 ratio
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.25rem',     // 20px
    xl: '1.5rem',      // 24px
    '2xl': '1.875rem', // 30px
    '3xl': '2.25rem',  // 36px
    '4xl': '3rem',     // 48px
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
}
```

### Spacing

```typescript
const spacing = {
  // 4px grid
  '0': '0',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '5': '1.25rem',  // 20px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '10': '2.5rem',  // 40px
  '12': '3rem',    // 48px
  '16': '4rem',    // 64px
  '20': '5rem',    // 80px
  '24': '6rem',    // 96px
  '32': '8rem',    // 128px
}
```

### Borders & Shadows

```typescript
const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',    // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    full: '9999px',
  },
  width: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
  },
}

const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}
```

## Component Patterns

The following patterns can be implemented in any framework (React, Vue, etc.) using the design tokens above.

### Button System

```typescript
const buttonStyles = {
  // Base styles all buttons share
  base: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 200ms;
    outline: none;
    &:focus-visible {
      ring: 2px;
      ring-offset: 2px;
    }
    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  `,
  
  // Size variants
  size: {
    sm: `
      height: 2.25rem;
      padding: 0 0.75rem;
      font-size: 0.875rem;
    `,
    md: `
      height: 2.5rem;
      padding: 0 1rem;
      font-size: 1rem;
    `,
    lg: `
      height: 2.75rem;
      padding: 0 1.5rem;
      font-size: 1rem;
    `,
  },
  
  // Variants
  variant: {
    primary: `
      background: var(--color-primary);
      color: white;
      &:hover {
        background: var(--color-primary-dark);
      }
    `,
    secondary: `
      background: white;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
      &:hover {
        background: var(--color-primary-50);
      }
    `,
    tertiary: `
      background: transparent;
      color: var(--color-primary);
      &:hover {
        background: var(--color-neutral-100);
      }
    `,
    danger: `
      background: var(--color-error);
      color: white;
      &:hover {
        background: var(--color-error-dark);
      }
    `,
  },
}
```

### Card Component

```typescript
const cardStyles = {
  base: `
    border-radius: 0.375rem;
    overflow: hidden;
    transition: box-shadow 200ms ease;
  `,
  
  variant: {
    outlined: `
      border: 1px solid var(--color-neutral-200);
      background: white;
    `,
    elevated: `
      box-shadow: var(--shadow-sm);
      background: white;
      &:hover {
        box-shadow: var(--shadow);
      }
    `,
    flat: `
      background: var(--color-neutral-50);
    `,
  },
  
  padding: {
    none: `padding: 0;`,
    sm: `padding: 0.75rem;`,
    md: `padding: 1.5rem;`,
    lg: `padding: 2rem;`,
  },
}
```

### Form Elements

```typescript
const inputStyles = {
  base: `
    display: block;
    width: 100%;
    height: 2.5rem;
    padding: 0 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--color-neutral-300);
    border-radius: 0.375rem;
    background: white;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    
    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-100);
      outline: none;
    }
    
    &:disabled {
      background: var(--color-neutral-100);
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    &::placeholder {
      color: var(--color-neutral-400);
    }
  `,
  
  error: `
    border-color: var(--color-error);
    
    &:focus {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px var(--color-error-100);
    }
  `,
}

const labelStyles = `
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-neutral-800);
`

const formGroupStyles = `
  margin-bottom: 1.5rem;
`

const errorMessageStyles = `
  margin-top: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-error);
`
```

## Layout Patterns

### Container

```typescript
const container = `
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
  
  @media (min-width: 640px) {
    max-width: 640px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  @media (min-width: 768px) {
    max-width: 768px;
  }
  
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
  
  @media (min-width: 1280px) {
    max-width: 1280px;
  }
`
```

### Stack

```typescript
const stack = (gap = '1rem') => `
  display: flex;
  flex-direction: column;
  gap: ${gap};
`
```

### Row

```typescript
const row = (gap = '1rem', align = 'center') => `
  display: flex;
  flex-direction: row;
  align-items: ${align};
  gap: ${gap};
`
```

### Grid

```typescript
const grid = (columns = 1, gap = '1rem') => `
  display: grid;
  grid-template-columns: repeat(${columns}, minmax(0, 1fr));
  gap: ${gap};
`
```

## Implementation Examples

### CSS Variables Implementation

```css
:root {
  /* Colors */
  --color-primary: #84793c;
  --color-primary-light: #a59e6a;
  --color-primary-dark: #635a2d;
  
  --color-primary-50: #f8f7f0;
  --color-primary-100: #f0ede0;
  --color-primary-200: #e0dbc1;
  --color-primary-300: #ccc59f;
  --color-primary-400: #b3a97a;
  --color-primary-500: #84793c;
  --color-primary-600: #756a35;
  --color-primary-700: #635a2d;
  --color-primary-800: #4a4321;
  --color-primary-900: #343018;
  
  --color-neutral-50: #f9f9f9;
  --color-neutral-100: #f0f0f0;
  --color-neutral-200: #e4e4e4;
  --color-neutral-300: #d1d1d1;
  --color-neutral-400: #b4b4b4;
  --color-neutral-500: #939393;
  --color-neutral-600: #6d6d6d;
  --color-neutral-700: #4F4F4F;
  --color-neutral-800: #333333;
  --color-neutral-900: #191919;
  
  --color-success: #4caf50;
  --color-error: #f44336;
  --color-warning: #ff9800;
  --color-info: #2196f3;
  
  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 1.875rem;
  --font-size-3xl: 2.25rem;
  --font-size-4xl: 3rem;
  
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.8;
  
  /* Spacing */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;
  --spacing-32: 8rem;
  
  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;
  --radius: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### Tailwind Config Implementation

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        DEFAULT: '#84793c',
        light: '#a59e6a',
        dark: '#635a2d',
        50: '#f8f7f0',
        100: '#f0ede0',
        200: '#e0dbc1',
        300: '#ccc59f',
        400: '#b3a97a',
        500: '#84793c',
        600: '#756a35',
        700: '#635a2d',
        800: '#4a4321',
        900: '#343018',
      },
      neutral: {
        50: '#f9f9f9',
        100: '#f0f0f0',
        200: '#e4e4e4',
        300: '#d1d1d1',
        400: '#b4b4b4',
        500: '#939393',
        600: '#6d6d6d',
        700: '#4F4F4F',
        800: '#333333',
        900: '#191919',
      },
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3',
      white: '#ffffff',
      transparent: 'transparent',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    },
    fontSize: {
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.25rem',
      'xl': '1.5rem',
      '2xl': '1.875rem',
      '3xl': '2.25rem',
      '4xl': '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8,
    },
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      DEFAULT: '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      'full': '9999px',
    },
    boxShadow: {
      'none': 'none',
      'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
    },
    extend: {
      transitionTimingFunction: {
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
    },
  },
  plugins: [],
}
```

## Design Best Practices

### Typography

1. **Limit Font Variations**: Use one typeface with 2-3 weights
2. **Consistent Hierarchy**: Follow scale for clear content organization
3. **Line Length**: Aim for 60-75 characters per line for readability
4. **Line Height**: Use tighter spacing for headings, looser for body text

### Whitespace

1. **Consistent Spacing**: Use the spacing scale consistently
2. **Content Breathing Room**: Allow for generous margins around key content
3. **Grouping Related Items**: Use less space between related items
4. **Section Separation**: Use more space between unrelated sections

### Color Usage

1. **Limited Palette**: Primary + neutrals + status colors
2. **Accessibility**: Maintain 4.5:1 contrast ratio for text
3. **Purposeful Color**: Use color to guide attention, not decorate
4. **Color Meaning**: Maintain consistent meaning (e.g., red for errors)

### Visual Hierarchy

1. **Primary Action Emphasis**: Make primary actions most prominent
2. **Progressive Disclosure**: Show details only when relevant
3. **Content First**: Design around the content, not vice versa
4. **Intuitive Scanning**: Design for F-pattern or Z-pattern reading

## Adaptation Guide

To adapt this minimalist design system to your specific application:

1. **Choose Your Brand Color**: Replace the primary color with your brand color
2. **Generate Color Scale**: Create a consistent scale around your brand color
3. **Typography Selection**: Choose a primary font that matches your brand voice
4. **Component Adaptation**: Build components using the patterns above
5. **Implementation**: Use CSS variables, utility classes, or a component library

By following this minimalist design system, you can build clean, focused interfaces that prioritize content and user experience across any application.