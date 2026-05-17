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
  const targetUserId = 'f325affc-dc9f-4eba-bee5-d54de20ab0ac'; // Karthik Naramala 2

  console.log(`Running getCustomerBookings query emulation for user ID: ${targetUserId}...`);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, business_id, slot_id, customer_name, customer_phone, booking_id, status, cancelled_by, cancellation_reason, cancelled_at, customer_user_id, rescheduled_from_booking_id, rescheduled_at, rescheduled_by, reschedule_reason, no_show, no_show_marked_at, no_show_marked_by, created_at, updated_at, undo_used_at",
    )
    .eq("customer_user_id", targetUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ QUERY ERROR:", error);
  } else {
    console.log("✅ QUERY SUCCESS! Bookings count:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking details:", JSON.stringify(bookings[0], null, 2));
    }
  }
}

check();
