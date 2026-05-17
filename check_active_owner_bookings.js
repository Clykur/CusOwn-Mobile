global.WebSocket = class {}; // Bypasses the WebSocket check for Node.js < 22

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

async function checkBookings() {
  console.log("Fetching all businesses...");
  const { data: businesses, error: bizError } = await supabase.from('businesses').select('id, salon_name, owner_user_id');
  if (bizError) {
    console.error("Error businesses:", bizError);
    return;
  }
  console.log(`Found ${businesses.length} businesses.`);

  console.log("Fetching bookings count grouped by business...");
  const { data: bookings, error: bookError } = await supabase.from('bookings').select('id, business_id, status');
  if (bookError) {
    console.error("Error bookings:", bookError);
    return;
  }
  console.log(`Found ${bookings.length} bookings in total.`);

  const bookingsByBiz = {};
  bookings.forEach(b => {
    bookingsByBiz[b.business_id] = (bookingsByBiz[b.business_id] || 0) + 1;
  });

  console.log("\nBusinesses with bookings:");
  businesses.forEach(b => {
    const count = bookingsByBiz[b.id] || 0;
    if (count > 0) {
      console.log(`- Business: ${b.salon_name} (ID: ${b.id}) owned by owner_user_id: ${b.owner_user_id} has ${count} bookings`);
    }
  });

  // Let's also check profiles of those owners
  const ownerIdsWithBookings = [...new Set(businesses.filter(b => bookingsByBiz[b.id] > 0).map(b => b.owner_user_id))];
  console.log("\nOwner profiles with bookings:", ownerIdsWithBookings);
  
  if (ownerIdsWithBookings.length > 0) {
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('id, full_name, user_type')
      .in('id', ownerIdsWithBookings);
    
    if (profError) {
      console.error("Error profiles:", profError);
    } else {
      console.log("Profiles found:", profiles);
    }
  }
}

checkBookings();
