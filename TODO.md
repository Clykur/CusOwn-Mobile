# TODO

## Google auth fix (Supabase + Expo)
- [x] Update `app/(auth)/login.tsx` to remove broken `disabled={!Request}` usage and correctly disable the Google button.
- [x] Update `src/hooks/useAuth.ts` to use `supabase.auth.signInWithOAuth({ provider: 'google' ... })` instead of `expo-auth-session` + `exchangeCodeForSession`.
- [x] Verify redirectUri/redirectTo consistency with `scheme: 'cusown'` and the `(auth)/login` route.

- [ ] Run/test Google sign-in flow and confirm the 400 malformed error is resolved.



