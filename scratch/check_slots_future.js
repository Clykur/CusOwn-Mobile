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
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log("Today is:", today);

    const { data: futureSlots, error } = await supabase
      .from('slots')
      .select('*')
      .gte('date', today)
      .limit(10);

    if (error) {
      console.error("Query error:", error);
      return;
    }

    console.log(`Found ${futureSlots.length} future slots:`);
    futureSlots.forEach(s => {
      console.log(`- ID: ${s.id}, Date: ${s.date}, Time: ${s.start_time} - ${s.end_time}, Biz: ${s.business_id}`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

check();
