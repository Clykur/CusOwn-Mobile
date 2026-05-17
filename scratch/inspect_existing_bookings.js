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
  console.log("Fetching last 10 bookings...");
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_user_id,
      customer_name,
      customer_phone,
      business_id,
      date,
      time,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Failed to fetch bookings:", error);
    return;
  }

  console.log(`✅ Fetched ${bookings.length} bookings successfully:`);
  console.log(JSON.stringify(bookings, null, 2));
}

check();
