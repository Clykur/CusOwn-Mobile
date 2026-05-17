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
  console.log("Searching for businesses with services...");
  const { data, error } = await supabase
    .from('services')
    .select('business_id, businesses(salon_name)')
    .limit(10);

  if (error) {
    console.error("❌ Failed to fetch services:", error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

check();
