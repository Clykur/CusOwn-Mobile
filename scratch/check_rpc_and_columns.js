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

async function checkRpcAndColumns() {
  try {
    // 1. Try to fetch soft_delete_user_account function information
    console.log("Checking if RPC functions exist...");
    const { data: functions, error: funcError } = await supabase
      .rpc("soft_delete_user_account", { p_user_id: "00000000-0000-0000-0000-000000000000", p_reason: "test" });

    if (funcError) {
      console.log("RPC soft_delete_user_account error:", funcError.message);
    } else {
      console.log("RPC soft_delete_user_account result:", functions);
    }

    // 2. Let's list some system functions if we can query them
    console.log("\nAttempting to query pg_proc to find any dynamic sql function...");
    const { data: procData, error: procError } = await supabase
      .from("user_profiles")
      .select("*")
      .limit(1);
    
    console.log("Completed basic check.");
  } catch (err) {
    console.error("Failure:", err);
  }
}

checkRpcAndColumns();
