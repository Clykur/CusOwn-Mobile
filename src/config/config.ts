export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  IS_DEV: __DEV__,
  UNDO_WINDOW_MINUTES: 5,
};

if (__DEV__) {
  console.log(`[Config] App Environment: Development`);
}
