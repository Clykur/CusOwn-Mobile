const fs = require('fs');
const path = require('path');

// Read env variables manually from project root
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

async function query(table, select = '*', filter = '') {
  const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&${filter}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Fetch ${table} failed: ${res.statusText} ${await res.text()}`);
  }
  return res.json();
}

async function run() {
  try {
    console.log('Fetching booking 3278cbf0-9b96-4f44-a47c-3e7910939341...');
    const details = await query(
      'bookings',
      '*,business:businesses(*),slot:slots(*),booking_services(price_cents,service:services(*))',
      'id=eq.3278cbf0-9b96-4f44-a47c-3e7910939341',
    );
    console.log('Booking Detail with relations:', JSON.stringify(details, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
