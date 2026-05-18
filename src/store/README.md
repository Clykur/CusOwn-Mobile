# Store

Global client state (Zustand).

## Current stores

- `auth.store.ts` — Session, role, profile bootstrap
- `booking.store.ts` — In-flow booking selection (business, services, slot)
- `onboarding.store.ts` — First-run / splash flags
- `active-role.store.ts` — Role switching UI state

## Rules

- **App-wide only** — feature-specific state belongs in features or React Query cache.
- **Do not** duplicate server data long-term; prefer `apiService` + React Query for remote data.
