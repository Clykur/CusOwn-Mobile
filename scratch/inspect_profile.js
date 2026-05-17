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
  const ids = [
    '640f8455-7bf5-494b-a725-9c55ed34322b',
    '70f289f5-2117-46e6-a6a7-520302d7aa6a',
    'f325affc-dc9f-4eba-bee5-d54de20ab0ac'
  ];

  console.log("Fetching profiles...");
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error("❌ Failed to fetch:", error);
    return;
  }

  console.log(JSON.stringify(profiles, null, 2));
}

check();
