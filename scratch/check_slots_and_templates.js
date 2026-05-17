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
    // Check total slots in database
    const { count: slotsCount, error: slotsErr } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true });
    
    console.log("Total slots in the database:", slotsCount);

    // Fetch a sample slot if any exists
    const { data: sampleSlots, error: sampleErr } = await supabase
      .from('slots')
      .select('*')
      .limit(5);

    if (sampleSlots && sampleSlots.length > 0) {
      console.log("Sample slots in database:");
      sampleSlots.forEach(s => {
        console.log(`- ID: ${s.id}, Date: ${s.date}, Time: ${s.start_time} - ${s.end_time}, Available: ${s.is_available}, Biz: ${s.business_id}`);
      });
    }

    // Let's check slot templates if any exist
    const { data: templates, error: tempErr } = await supabase
      .from('slot_templates')
      .select('*')
      .limit(5);

    console.log("Slot templates count:", templates?.length || 0);

  } catch (err) {
    console.error("Error:", err);
  }
}

check();
