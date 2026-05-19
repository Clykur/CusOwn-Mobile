global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync(
  '/Users/karthiknaramala/Desktop/CusOwn-Mobile/.env.local',
  'utf8',
);
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function run() {
  try {
    // 1. Fetch KAR STYLISH SALON
    const { data: businesses, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .ilike('salon_name', '%kar stylish%');

    if (bizErr) {
      console.error('Error fetching business:', bizErr);
      return;
    }

    console.log('Businesses matching KAR STYLISH SALON:', businesses.length);
    if (!businesses || businesses.length === 0) {
      console.log('No businesses found.');
      return;
    }

    const ownerId = businesses[0].owner_user_id;
    console.log('Owner User ID:', ownerId);

    // 2. Try listing files in profile-media for this owner
    // bucket is usually profile-media
    const folder = `${ownerId}`;
    console.log(`Listing files in bucket 'profile-media' folder '${folder}' using anon key...`);
    const { data: filesAnon, error: listErrAnon } = await supabase.storage
      .from('profile-media')
      .list(folder);

    if (listErrAnon) {
      console.error('Anon Error listing storage:', listErrAnon);
    } else {
      console.log('Anon Files found:', filesAnon);
      if (filesAnon && filesAnon.length > 0) {
        filesAnon.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const latestFile = filesAnon[0];
        const path = `${folder}/${latestFile.name}`;
        const pubUrl = supabase.storage.from('profile-media').getPublicUrl(path).data.publicUrl;
        console.log('Resolved Public URL (Anon):', pubUrl);
      }
    }

    console.log(`Listing files in bucket 'profile-media' folder '${folder}' using admin key...`);
    const { data: filesAdmin, error: listErrAdmin } = await supabaseAdmin.storage
      .from('profile-media')
      .list(folder);

    if (listErrAdmin) {
      console.error('Admin Error listing storage:', listErrAdmin);
    } else {
      console.log('Admin Files found:', filesAdmin);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
