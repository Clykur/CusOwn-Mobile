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

async function printMagicLink() {
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'naramalakarthik143@gmail.com',
  });

  if (linkError) {
    console.error("Magic link generation failed:", linkError);
    return;
  }

  console.log("Action Link:", linkData.properties.action_link);
}

printMagicLink();
