# Services

Application data access layer.

## Contents

- `api.service.ts` — Facade used by hooks and screens (Supabase-only).
- `supabase/` — Queries, RPCs, mappers, storage (see `supabase/README.md`).
- `supabase.service.ts` — Deprecated compatibility shim.

## Rules

- Screens and features call **`apiService`** (or feature hooks that call it).
- **Do not** import `@supabase/supabase-js` from UI layers except realtime where explicitly needed.
- **Do not** reintroduce REST/axios clients here.
