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
  console.log("Fetching sample slot...");
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .limit(1);

  if (error) {
    console.error("❌ Failed to fetch:", error);
    return;
  }

  console.log("✅ Sample Slot:", JSON.stringify(data[0], null, 2));
}

check();
