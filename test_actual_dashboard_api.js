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
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'naramalakarthik143@gmail.com',
  });

  if (linkError) {
    console.error("Magic link generation failed:", linkError);
    return;
  }

  const verifyUrl = linkData.properties.action_link;

  try {
    const res = await axios.get(verifyUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const location = res.headers.location;
    if (location) {
      const parsedUrl = new URL(location);
      const hash = parsedUrl.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      
      if (token) {
        console.log("✅ Successfully acquired real JWT token!");
        
        // Make the call to Next.js API!
        console.log("\nCalling GET http://localhost:3000/api/owner/dashboard...");
        const apiRes = await axios.get('http://localhost:3000/api/owner/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("\nResponse HTTP Status:", apiRes.status);
        console.log("Response JSON Data:", JSON.stringify(apiRes.data, null, 2));
      } else {
        console.error("Access token not found in location hash:", hash);
      }
    } else {
      console.log("No location header. Status:", res.status);
    }
  } catch (err) {
    console.error("Failed to verify:", err.message);
  }
}

testApiEndpoint();
