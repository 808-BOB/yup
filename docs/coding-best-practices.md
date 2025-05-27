# Coding & Dev Best Practices

## Project Structure
- Organize by feature (`features/FeatureName`) or domain.
- Use a `components/` directory for truly reusable UI components.
- Keep `services/` for API interactions, `hooks/` for custom hooks, `utils/` for helpers.
- Limit file size to approximately 150 lines of code. Split logic if it gets too big.

## Component Design
- Use function components with hooks. Avoid class components.
- One component per file. Prefer composability and reusability.
- Follow consistent import order: core libraries, third-party libraries, internal modules, then styles.
- Typical structure:

```tsx
const MyComponent = () => {
  const [state, setState] = useState(...);     // 1. State & Hooks
  useEffect(() => { ... }, []);                // 2. Side Effects
  const handleClick = () => { ... };           // 3. Event Handlers
  return <div>...</div>;                       // 4. JSX Return
};
```

## State Management
- Local UI state: `useState`, `useReducer`
- Shared application state: `useContext` or libraries like Zustand or Redux Toolkit
- Avoid prop drilling. Instead, lift state or use context.

## API Handling
- Centralize API calls in `services/`.
- Use `axios` or `fetch`, wrapped in functions that include error handling.
- Don’t place fetch logic inside React components.
- For advanced needs, consider SWR, React Query, or tRPC.

Example:
```ts
// services/userService.ts
export const getUser = (id: string) => fetch(`/api/users/${id}`).then(res => res.json());
```

## Testing
- Use Jest with React Testing Library.
- Test logic (hooks), component rendering, and UI interactions.
- Follow a "test behavior, not implementation" mindset.

## Performance Optimization
- Use `useMemo` and `useCallback` to avoid unnecessary recalculations.
- Wrap components with `React.memo` when needed.
- Debounce expensive operations (e.g. search input).
- Use `React.lazy()` and `Suspense` for code-splitting.

## Clean Code Principles
- DRY (Don't Repeat Yourself), KISS (Keep It Simple), YAGNI (You Aren't Gonna Need It).
- Use descriptive names: `handleFormSubmit`, not `submitForm`.
- Extract business logic into custom hooks or utility functions.
- Group imports and use consistent formatting (via ESLint and Prettier).
