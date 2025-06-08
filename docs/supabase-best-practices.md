
## 4. Replit Agent – Supabase Integration Best Practices

### Environment Setup
- Always use `@supabase/supabase-js` SDK for interaction.
- Store the Supabase URL and anon/public API key as Replit environment secrets.
- Do not hardcode credentials in code files.

```ts
// utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

### Data Handling
- Query and mutation logic should reside in `services/` (e.g., `services/userService.ts`).
- Do not call Supabase directly from inside React components.
- Wrap inserts, selects, updates in clearly named async functions with error handling.

```ts
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}
```

### Auth Integration
- Use Supabase’s built-in auth hooks if using `supabase-auth-ui-react`.
- Store session/token data securely and avoid exposing it in logs.
- Use `onAuthStateChange` to sync local state with backend.

### Agent Behaviors
- Replit agent should never auto-run data mutations without an explicit user command.
- All Supabase calls must:
  - Confirm table/column names match schema.
  - Handle empty/null responses.
  - Be idempotent where possible (e.g., upserts, safe updates).

### Logging & Debugging
- Log all Supabase responses through a centralized logger (not `console.log` scattered across files).
- Return shaped responses with clear status indicators.
- In dev mode, you may show Supabase errors in UI (never in production).
