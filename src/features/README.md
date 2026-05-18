# Features

Domain-oriented modules for CusOwn Mobile. Each feature owns screens, UI, and hooks for a product area.

## Layout

| Folder      | Responsibility                                     |
| ----------- | -------------------------------------------------- |
| `auth/`     | Sign-in, OAuth callback, auth hooks                |
| `customer/` | Browse, home, profile, customer bookings           |
| `owner/`    | Dashboard, hub, analytics, business setup          |
| `booking/`  | Booking flow, booking detail, booking hooks        |
| `reviews/`  | Rating prompts and review UI                       |
| `shared/`   | Public onboarding, splash, cross-feature utilities |

## Rules

- Put **screen implementations** in `features/*/screens/`.
- Put **domain components** in `features/*/components/`.
- Put **feature hooks** in `features/*/hooks/`.
- **Do not** put Supabase queries here — use `src/services/supabase/` via `api.service.ts`.
- **Do not** put design-system primitives here — use `src/components/ui/`.

## Routing

Expo Router files under `app/` should re-export feature screens and stay thin.
