# Lib

Infrastructure used across the app (no product domain).

## Examples

- `supabase.ts` — Supabase client singleton
- `queryClient.ts` — TanStack Query client and keys
- `oauthParams.ts`, `webCryptoPolyfill.ts` — Auth/runtime helpers
- `whatsapp.ts` — Deep link builders (replaces legacy REST WhatsApp endpoint)

## Rules

- **No** screen components or business rules.
- **No** direct table queries — use `src/services/supabase/`.
