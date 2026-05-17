// Run in Mobile workspace context but require from backend packages
const path = require('path');
const fs = require('fs');

// Read the backend .env.local file
const envFile = fs.readFileSync('/Users/karthiknaramala/Desktop/CusOwn/apps/app/.env.local', 'utf8');
const getEnvVal = (key) => {
  const match = envFile.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

process.env.NEXT_PUBLIC_SUPABASE_URL = getEnvVal('NEXT_PUBLIC_SUPABASE_URL');
process.env.SUPABASE_SERVICE_ROLE_KEY = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

const { requireSupabaseAdmin } = require('/Users/karthiknaramala/Desktop/CusOwn/packages/shared/dist/server.js');

const ownerId = '640f8455-7bf5-494b-a725-9c55ed34322b';

async function testQuery() {
  console.log("Initializing requireSupabaseAdmin...");
  try {
    const supabase = requireSupabaseAdmin();
    console.log("Supabase admin client initialized.");

    // Fetch user businesses
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", ownerId)
      .eq("suspended", false)
      .is("deleted_at", null);

    if (bizError) {
      console.error("Businesses error:", bizError);
      return;
    }
    console.log("Businesses count:", businesses?.length);

    const businessIds = businesses.map(b => b.id);
    console.log("Business IDs:", businessIds);

    // Run query
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, status, no_show, created_at, business_id")
      .in("business_id", businessIds);

    if (bookingsError) {
      console.error("Bookings error:", bookingsError);
    } else {
      console.log("Bookings fetched successfully. Count:", bookings?.length);
    }
  } catch (err) {
    console.error("Error during execution:", err);
  }
}

testQuery();
