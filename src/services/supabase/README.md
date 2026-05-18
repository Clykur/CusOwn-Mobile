# Supabase data layer

All Postgres, RPC, and storage access for the mobile app.

## Modules

Domain files (`businesses.ts`, `bookings.ts`, `services.ts`, etc.) map database rows to app types via `mappers.ts`.

Shared helpers: `errors.ts`, `owner-access.ts`, `select-fallback.ts`, `booking-rpc.ts`.

## Rules

- Keep **RLS-aware** selects and fallbacks here, not in screens.
- Prefer **narrow selects** and retries via `select-fallback` over failing entire lists.
- **Do not** import React or Expo from this folder.
- Types: use `@/types/*` shims or `@/features/*/types` — avoid circular imports into features.
