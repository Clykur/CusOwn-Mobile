global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnvVal = (key) => {
  const match = envFile.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVal('EXPO_PUBLIC_SUPABASE_URL') || getEnvVal('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching bookings with customer_user_id...");
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_user_id, customer_name, customer_phone, created_at, status')
    .not('customer_user_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch:", error);
    return;
  }

  console.log(`✅ Found ${bookings.length} bookings with user IDs:`);
  console.log(JSON.stringify(bookings.slice(0, 10), null, 2));
}

check();
