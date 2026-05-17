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

async function runDashboardServiceTest() {
  console.log("Emulating dashboardService.fetchOwnerDashboardData exactly...");
  try {
    // 1. Get businesses
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", ownerId)
      .eq("suspended", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (bizError) throw bizError;
    console.log("✅ Businesses count:", businesses.length);

    let businessIds = businesses.map(b => b.id);

    // 2. Fetch bookings with pagination/fallback
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
      const fallbackQuery = supabase
        .from("bookings")
        .select(
          "id, business_id, slot_id, customer_name, customer_phone, booking_id, status, cancelled_by, cancellation_reason, cancelled_at, customer_user_id, no_show, no_show_marked_at, created_at, updated_at"
        )
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      const fallback = await fallbackQuery;
      if (fallback.error) throw fallback.error;
      allBookings = fallback.data || [];
    } else {
      allBookings = data || [];
    }
    console.log("✅ Bookings count:", allBookings.length);

    // Calculate stats
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.status === "confirmed").length;
    const pendingBookings = allBookings.filter(b => b.status === "pending").length;
    const rejectedBookings = allBookings.filter(b => b.status === "rejected").length;
    const cancelledBookings = allBookings.filter(b => b.status === "cancelled").length;
    const noShowCount = allBookings.filter(b => b.no_show).length;

    console.log("\nCalculated Stats:");
    console.log({
      totalBusinesses: businesses.length,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      rejectedBookings,
      cancelledBookings,
      noShowCount,
    });
  } catch (err) {
    console.error("❌ CRITICAL ERROR:", err);
  }
}

runDashboardServiceTest();
