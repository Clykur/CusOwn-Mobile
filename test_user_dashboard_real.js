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

const ownerId = '640f8455-7bf5-494b-a725-9c55ed34322b'; // KARTHIK NARAMALA

async function testUserDashboardReal() {
  console.log("Starting real dashboard emulation for user:", ownerId);
  
  // Step 1: getUserBusinesses
  const { data: businesses, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", ownerId)
    .eq("suspended", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (bizError) {
    console.error("❌ getUserBusinesses failed:", bizError);
    return;
  }
  
  console.log("✅ Businesses found:", businesses.map(b => ({ id: b.id, salon_name: b.salon_name })));
  
  if (businesses.length === 0) {
    console.log("No businesses found");
    return;
  }

  let businessIds = businesses.map((b) => b.id);

  // Step 2: Fetch bookings
  console.log("\n[Step 2] Fetching bookings...");
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  
  let query = supabase
    .from("bookings")
    .select(
      "id, business_id, slot_id, customer_name, customer_phone, booking_id, status, cancelled_by, cancellation_reason, cancelled_at, customer_user_id, no_show, no_show_marked_at, created_at, updated_at, undo_used_at",
    )
    .in("business_id", businessIds)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const { data, error } = await query;
  
  if (error) {
    console.error("❌ Fetch bookings query failed:", error);
    
    // Attempt fallback query
    console.log("Attempting fallback query (without undo_used_at)...");
    const fallbackQuery = supabase
      .from("bookings")
      .select(
        "id, business_id, slot_id, customer_name, customer_phone, booking_id, status, cancelled_by, cancellation_reason, cancelled_at, customer_user_id, no_show, no_show_marked_at, created_at, updated_at"
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
      
    const fallbackRes = await fallbackQuery;
    if (fallbackRes.error) {
      console.error("❌ Fallback query also failed:", fallbackRes.error);
      return;
    } else {
      console.log("✅ Fallback query succeeded! Bookings count:", fallbackRes.data.length);
      allBookings = fallbackRes.data;
    }
  } else {
    console.log("✅ Bookings query succeeded! Bookings count:", data.length);
    allBookings = data;
  }

  console.log("\nBooking status distribution:");
  const statusCounts = {};
  allBookings.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });
  console.log(statusCounts);
}

testUserDashboardReal();
