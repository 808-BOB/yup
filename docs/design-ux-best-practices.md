# Design / UX Best Practices

## Design Tokens
Maintain a centralized, theme-based design token system:
- Colors: `--color-primary`, `--color-surface`, `--color-error`
- Typography: `--font-heading`, `--font-body`, `--font-size-base`
- Spacing: `--spacing-xs`, `--spacing-md`, `--spacing-xl`
- Border Radius: `--radius-sm`, `--radius-lg`

Use a JSON structure and sync with Figma and Tailwind through Tokens Studio or a custom tool.

## Component System
- Start atomic: base components like `Button`, `Input`, `Badge`
- Combine into compound components like `Card`, `Navbar`, `FormSection`
- Build full layouts from section components

## Responsive Design
- Design mobile-first using Tailwind utility classes (`sm:`, `md:`, `lg:`)
- Use auto-layout in Figma to mimic Flexbox structure
- Avoid fixed widths. Prefer flex, % widths, or min/max constraints

## UX Heuristics
- Always show system state (loading, error, success)
- Provide user feedback for all actions
- Keep navigation consistent and visible
- Reduce friction: clear CTAs, input validation, keyboard accessibility
- Be deliberate with spacing, contrast, and hierarchy
