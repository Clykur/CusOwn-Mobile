const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../CusOwn/apps/app/.env.local') });

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function analyze() {
  const userId = "640f8455-7bf5-494b-a725-9c55ed34322b";
  try {
    // 1. Get all businesses for this owner, including deleted/suspended
    const { data: businesses, error: busError } = await supabase
      .from("businesses")
      .select("id, salon_name, suspended, deleted_at")
      .eq("owner_user_id", userId);

    if (busError) {
      console.error("Businesses error:", busError.message);
      return;
    }

    console.log("All Businesses under owner:", JSON.stringify(businesses, null, 2));

    const businessIds = businesses.map(b => b.id);

    if (businessIds.length === 0) {
      console.log("No businesses found for this user!");
      return;
    }

    // 2. Query bookings count by business_id and grouping by status/deleted
    const { data: bookings, error: bookError } = await supabase
      .from("bookings")
      .select("id, business_id, status, created_at")
      .in("business_id", businessIds);

    if (bookError) {
      console.error("Bookings error:", bookError.message);
      return;
    }

    console.log(`\nTotal Bookings across ALL these businesses: ${bookings.length}`);
    
    // Group bookings by business and status
    const summary = {};
    for (const b of businesses) {
      summary[b.id] = {
        name: b.salon_name,
        deleted: b.deleted_at !== null,
        total: 0,
        byStatus: {}
      };
    }

    for (const bk of bookings) {
      const bInfo = summary[bk.business_id];
      if (bInfo) {
        bInfo.total++;
        bInfo.byStatus[bk.status] = (bInfo.byStatus[bk.status] || 0) + 1;
      }
    }

    console.log("\nBookings Summary by Business:", JSON.stringify(summary, null, 2));

    // 3. Let's also check total bookings in the whole database (irrespective of business owner)
    const { count: totalDbBookings } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true });

    console.log(`\nTotal Bookings in entire database (all businesses combined): ${totalDbBookings}`);

  } catch (err) {
    console.error("Failure:", err);
  }
}

analyze();
