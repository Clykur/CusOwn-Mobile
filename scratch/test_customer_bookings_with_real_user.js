global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const axios = require('axios');

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
    // 1. Fetch user email for a user who has bookings
    // Let's find a user with bookings from the previous database list, e.g., 56cae3ad-89f8-4f76-bc16-718f1598911f
    const targetUserId = '56cae3ad-89f8-4f76-bc16-718f1598911f'; 

    const { data: userRecord, error: userError } = await supabase.auth.admin.getUserById(targetUserId);
    if (userError || !userRecord?.user) {
      console.error("User fetch error:", userError);
      return;
    }

    const email = userRecord.user.email;
    console.log(`Target User: ${userRecord.user.user_metadata?.full_name} (${email})`);

    // 2. Generate Magic Link or password recovery token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return;
    }

    console.log("Action Link:", linkData.properties.action_link);
    const parsedUrl = new URL(linkData.properties.action_link);
    
    // Extract token from query params
    const otpToken = parsedUrl.searchParams.get('token');
    console.log("OTP Verification Token:", otpToken ? `${otpToken.substring(0, 15)}...` : "None");

    if (!otpToken) {
      console.error("Could not find OTP verification token in URL");
      return;
    }

    // Exchange the verification token for a real session
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otpToken,
      type: 'magiclink'
    });

    if (verifyError || !sessionData?.session) {
      console.error("Verification error:", verifyError);
      return;
    }

    const token = sessionData.session.access_token;
    console.log("Extracted JWT Access Token:", token ? `${token.substring(0, 20)}...` : "None");

    // Let's call the API!
    if (token) {
      console.log("\nCalling GET http://localhost:3000/api/customer/bookings...");
      const res = await axios.get('http://localhost:3000/api/customer/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Status:", res.status);
      console.log("Bookings Response:", JSON.stringify(res.data, null, 2));
    }

  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

check();
