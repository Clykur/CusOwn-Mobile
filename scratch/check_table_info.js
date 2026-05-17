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

async function checkSchema() {
  try {
    const { data: cols, error } = await supabase
      .from("user_profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error fetching rows:", error.message);
    } else {
      console.log("Keys in first row of user_profiles:", cols.length > 0 ? Object.keys(cols[0]) : "Empty table");
    }
  } catch (err) {
    console.error("Failure:", err);
  }
}

checkSchema();
