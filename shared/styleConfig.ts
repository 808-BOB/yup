/**
 * Yup.RSVP StyleConfig
 * 
 * This file contains the core style configurations for the application.
 * It can be imported and used by components to maintain consistent styling.
 * An AI agent can use this as a reference for understanding the design system.
 */

export const colors = {
  primary: {
    DEFAULT: '#84793c', // Olive Gold - Primary brand color
    light: '#a59e6a',
    dark: '#635a2d',
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
    50: '#f9f9f9',
    100: '#f0f0f0',
    200: '#e4e4e4',
    300: '#d1d1d1',
    400: '#b4b4b4',
    500: '#939393',
    600: '#6d6d6d',
    700: '#4F4F4F',
    800: '#333333', // Primary text color
    900: '#191919',
  },
  background: {
    DEFAULT: '#ffffff',
    subtle: '#f9f9f9',
    muted: '#f0f0f0',
  },
  success: {
    DEFAULT: '#4caf50',
    light: '#a5d6a7',
    dark: '#388e3c',
  },
  error: {
    DEFAULT: '#f44336',
    light: '#ef9a9a',
    dark: '#d32f2f',
  },
  warning: {
    DEFAULT: '#ff9800',
    light: '#ffcc80',
    dark: '#f57c00',
  },
  info: {
    DEFAULT: '#2196f3',
    light: '#90caf9',
    dark: '#1976d2',
  },
};

export const typography = {
  fontFamily: {
    primary: 'Inter, system-ui, -apple-system, sans-serif',
  },
  fontSizes: {
    display: '2.5rem', // 40px
    h1: '2rem',        // 32px
    h2: '1.5rem',      // 24px
    h3: '1.25rem',     // 20px
    body: '1rem',      // 16px
    small: '0.875rem', // 14px
    xs: '0.75rem',     // 12px
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,   // For headings
    normal: 1.5,  // For body text
    loose: 1.8,   // For readable paragraphs
  },
  letterSpacing: {
    tight: '-0.01em', // For headings
    normal: 'normal', // For body text
  },
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
};

export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px',   // Circular
  },
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

export const animations = {
  timings: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const containerWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  DEFAULT: 'max-w-7xl', // Tailwind class
};

export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  sizes: {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
  },
  variants: {
    primary: `bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary`,
    secondary: `bg-white text-primary border border-primary hover:bg-primary-50 focus-visible:ring-primary`,
    outline: `bg-transparent border border-neutral-300 hover:bg-neutral-100 text-neutral-800`,
    ghost: `bg-transparent hover:bg-neutral-100 text-neutral-800`,
    destructive: `bg-error text-white hover:bg-error-dark focus-visible:ring-error`,
    link: `bg-transparent underline-offset-4 hover:underline text-primary p-0 h-auto font-normal`,
  },
};

export const inputStyles = {
  base: 'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  error: 'border-error focus:ring-error',
  sizes: {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
  },
};

export const cardStyles = {
  base: 'rounded-md border border-neutral-200 bg-white p-6',
  variants: {
    elevated: 'shadow-md border-transparent',
    outlined: 'border border-neutral-200',
    filled: 'bg-neutral-50 border-transparent',
  },
};

// Typography components with consistent styling
export const typographyStyles = {
  h1: 'text-3xl font-bold tracking-tight text-neutral-800',
  h2: 'text-2xl font-semibold tracking-tight text-neutral-800',
  h3: 'text-xl font-semibold tracking-tight text-neutral-800',
  h4: 'text-lg font-semibold text-neutral-800',
  p: 'text-base text-neutral-700 leading-normal',
  small: 'text-sm text-neutral-600',
  subtle: 'text-sm text-neutral-500',
};

// Icon size guidelines
export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// Common layout patterns
export const layoutStyles = {
  pageContainer: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  contentSection: 'py-8 md:py-12',
  grid: {
    base: 'grid grid-cols-12 gap-4',
    responsive: {
      oneCol: 'col-span-12',
      twoCols: 'col-span-12 md:col-span-6',
      threeCols: 'col-span-12 md:col-span-4',
      fourCols: 'col-span-12 sm:col-span-6 md:col-span-3',
    },
  },
  stack: 'flex flex-col space-y-4',
  row: 'flex flex-row space-x-4 items-center',
};

// Compound components configurations
export const componentConfigs = {
  header: {
    base: 'border-b border-neutral-200 bg-white',
    inner: 'mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between',
    logo: 'text-primary font-bold text-xl',
    nav: 'flex items-center space-x-4',
  },
  footer: {
    base: 'bg-neutral-50 border-t border-neutral-200',
    inner: 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8',
    sections: 'grid grid-cols-1 md:grid-cols-3 gap-8',
  },
  authForms: {
    container: 'mx-auto max-w-md w-full px-4 py-12',
    title: 'text-2xl font-bold mb-6 text-center',
    form: 'space-y-4',
    field: 'space-y-2',
    label: 'block text-sm font-medium text-neutral-700',
    input: inputStyles.base,
    error: 'text-sm text-error mt-1',
    button: 'w-full mt-6',
  },
  eventCard: {
    container: 'border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition-shadow',
    imageContainer: 'aspect-video w-full overflow-hidden',
    image: 'w-full h-full object-cover',
    content: 'p-4',
    title: 'font-medium text-lg text-neutral-800 mb-1',
    date: 'text-sm text-neutral-600 mb-2',
    footer: 'flex justify-between items-center mt-4',
  },
  modal: {
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4',
    container: 'bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden',
    header: 'px-6 py-4 border-b border-neutral-200',
    title: 'text-lg font-medium text-neutral-800',
    body: 'px-6 py-4 overflow-y-auto',
    footer: 'px-6 py-4 border-t border-neutral-200 flex justify-end gap-2',
  },
};

/**
 * Usage within components example:
 * 
 * import { buttonStyles, colors } from '@/shared/styleConfig';
 * 
 * function Button({ variant = 'primary', size = 'md', children }) {
 *   return (
 *     <button 
 *       className={`${buttonStyles.base} ${buttonStyles.sizes[size]} ${buttonStyles.variants[variant]}`}
 *     >
 *       {children}
 *     </button>
 *   );
 * }
 */

/**
 * Integration with Tailwind example:
 * Add to tailwind.config.js:
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       colors: require('./shared/styleConfig').colors,
 *       fontFamily: {
 *         sans: [require('./shared/styleConfig').typography.fontFamily.primary],
 *       },
 *       borderRadius: require('./shared/styleConfig').borders.radius,
 *       // etc.
 *     }
 *   }
 * }
 */

export default {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  animations,
  breakpoints,
  containerWidths,
  buttonStyles,
  inputStyles,
  cardStyles,
  typographyStyles,
  iconSizes,
  layoutStyles,
  componentConfigs,
};