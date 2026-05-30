process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

if (typeof process.env.EXPO_OS === 'undefined') {
  process.env.EXPO_OS = 'ios';
}

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
