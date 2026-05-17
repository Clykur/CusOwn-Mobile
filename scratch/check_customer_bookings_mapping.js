global.WebSocket = class {}; // Bypass WebSocket check
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
    // 1. Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_phone, status, customer_user_id, created_at')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error("Bookings error:", bookingsError);
      return;
    }

    console.log("=== BOOKINGS IN DATABASE ===");
    console.log(`Total Bookings: ${bookings.length}`);
    bookings.slice(0, 10).forEach(b => {
      console.log(`- ID: ${b.id}, Name: ${b.customer_name}, Phone: ${b.customer_phone}, Status: ${b.status}, UserID: ${b.customer_user_id}`);
    });

    // 2. Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, user_type, phone_number');

    if (profilesError) {
      console.error("Profiles error:", profilesError);
      return;
    }

    console.log("\n=== USER PROFILES ===");
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.full_name}, Phone: ${p.phone_number}, Type: ${p.user_type}`);
    });

  } catch (err) {
    console.error("Fatal Error:", err);
  }
}

check();
