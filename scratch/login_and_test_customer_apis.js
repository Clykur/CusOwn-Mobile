global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');

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
    const email = 'naramalakarthik143@gmail.com';
    const userId = '640f8455-7bf5-494b-a725-9c55ed34322b';
    const password = 'Password123!';

    console.log(`Setting password for ${email} (${userId})...`);
    const { data: user, error: updateErr } = await supabase.auth.admin.updateUserById(
      userId,
      { password: password }
    );

    if (updateErr) {
      console.error("❌ Password reset failed:", updateErr);
      return;
    }
    console.log("✅ Password reset successful!");

    console.log("Logging in via signInWithPassword...");
    const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginErr || !sessionData?.session) {
      console.error("❌ Sign in failed:", loginErr);
      return;
    }

    const token = sessionData.session.access_token;
    console.log("✅ Authenticated! JWT token successfully acquired.");

    // Test 1: Get Customer Bookings
    console.log("\n--- TEST 1: GET /api/customer/bookings ---");
    try {
      const res = await axios.get('http://localhost:3000/api/customer/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Status:", res.status);
      console.log("Bookings Count:", res.data?.data?.length ?? res.data?.length ?? 0);
      console.log("Response data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("❌ GET /api/customer/bookings failed:", err.response?.data || err.message);
    }

    // Test 2: Get slots for kar salon
    const salonId = '66633a24-c11c-4c04-8eeb-b8cb42f06102';
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n--- TEST 2: GET /api/slots for salon ${salonId} on date ${today} ---`);
    let targetSlot = null;
    try {
      const res = await axios.get(`http://localhost:3000/api/slots?salon_id=${salonId}&date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Status:", res.status);
      const data = res.data?.data || res.data;
      const slots = data?.slots || [];
      console.log("Slots found count:", slots.length);
      if (slots.length > 0) {
        targetSlot = slots[0];
        console.log("Sample slot:", JSON.stringify(targetSlot, null, 2));
      }
    } catch (err) {
      console.error("❌ GET /api/slots failed:", err.response?.data || err.message);
    }

    // Test 3: Create booking
    if (targetSlot) {
      console.log("\n--- TEST 3: POST /api/bookings ---");
      try {
        const payload = {
          salon_id: salonId,
          slot_id: targetSlot.id,
          customer_name: "Karthik Naramala Test",
          customer_phone: "+919949740776",
          service_ids: ["a0225102-1cb4-4eb4-bee5-618f15abde2f"], // Needs to be a valid service ID of that salon
          date: today
        };
        console.log("Using payload:", JSON.stringify(payload, null, 2));
        
        // Find valid services for this salon first to be sure
        const { data: services, error: svcErr } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', salonId);
          
        if (services && services.length > 0) {
          payload.service_ids = [services[0].id];
          console.log(`Updated payload with real service: ${services[0].name} (${services[0].id})`);
        }

        const res = await axios.post('http://localhost:3000/api/bookings', payload, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-idempotency-key': `test-${Date.now()}`
          }
        });
        console.log("Status:", res.status);
        console.log("Booking created response:", JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.error("❌ POST /api/bookings failed:", err.response?.data || err.message);
      }
    }

  } catch (err) {
    console.error("Fatal Error:", err);
  }
}

check();
