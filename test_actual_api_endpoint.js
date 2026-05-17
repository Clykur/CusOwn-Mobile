global.WebSocket = class {}; // Bypasses the WebSocket check for Node.js < 22

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

const ownerId = '640f8455-7bf5-494b-a725-9c55ed34322b'; // KARTHIK NARAMALA

async function testApiEndpoint() {
  console.log("Generating custom JWT token or finding session for user:", ownerId);

  // Since we have service role key, we can generate a session token or sign in.
  // The easiest way is to use supabase auth admin to create a user session or get an access token.
  // Wait, let's try calling supabase auth sign in or using admin.generateLink or similar.
  // Or we can get a session token using password or passwordless login.
  // Since naramalakarthik143@gmail.com is already registered, let's check its profiles or use OTP.
  // Wait, we can sign in using `admin.generateLink` for 'magiclink' which gives a token/url.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'naramalakarthik143@gmail.com',
  });

  if (linkError) {
    console.error("Magic link generation failed:", linkError);
    return;
  }

  // Extract access token from magiclink URL
  const parsedUrl = new URL(linkData.properties.action_link);
  const hash = parsedUrl.hash.substring(1); // remove '#'
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');

  if (!token) {
    console.error("Could not find access token in hash params:", hash);
    return;
  }

  console.log("✅ Successfully acquired real JWT token for KARTHIK NARAMALA");

  // Call the Next.js API running on http://localhost:3000
  console.log("\nCalling GET http://localhost:3000/api/customer/bookings...");
  try {
    const res = await axios.get('http://localhost:3000/api/customer/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("\nResponse Status:", res.status);
    console.log("Raw Response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ HTTP request failed:", err.response ? err.response.data : err.message);
  }
}

testApiEndpoint();
