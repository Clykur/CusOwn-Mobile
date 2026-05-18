# Database migrations

SQL migrations for the Supabase project. Apply **in filename order** (timestamp prefix).

| Migration                                            | Purpose                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `20260519100001_fix_user_profiles_rls_recursion.sql` | `auth_is_admin()` + fix recursive `user_profiles` RLS  |
| `20260519100002_fix_rls_customer_browse.sql`         | Customer browse: businesses, services, bookings SELECT |
| `20260519100003_fix_rls_reviews.sql`                 | Public read for non-hidden reviews                     |

## Apply

**Supabase CLI (linked project):**

```bash
supabase db push
```

**Or** run each file in the [Supabase SQL Editor](https://supabase.com/dashboard) in order.

## Docs

Background and audit notes: `docs/supabase-migration/RLS_DATA_ACCESS.md`, `RLS_USER_PROFILES.md`, `BOOKING_RPC.md`.

Reference schema snapshot: `supabase/schema.sql` (not a migration — for documentation only).
