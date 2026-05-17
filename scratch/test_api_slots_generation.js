const axios = require('axios');

async function check() {
  const salonId = '66633a24-c11c-4c04-8eeb-b8cb42f06102'; // kar salon
  const futureDate = '2026-05-20'; // 3 days in the future

  console.log(`Calling GET /api/slots for salon ${salonId} on future date ${futureDate}...`);

  try {
    const res = await axios.get(`http://localhost:3000/api/slots?salon_id=${salonId}&date=${futureDate}`);
    console.log("Status:", res.status);
    console.log("Response Keys:", Object.keys(res.data));
    console.log("Success field:", res.data?.success);
    
    const data = res.data?.data || res.data;
    console.log("Closed:", data?.closed);
    console.log("Message:", data?.message);
    const slots = data?.slots || [];
    console.log("Slots found count:", slots.length);
    if (slots.length > 0) {
      console.log("First slot:", JSON.stringify(slots[0], null, 2));
    }
  } catch (err) {
    console.error("❌ GET /api/slots failed:", err.response?.data || err.message);
  }
}

check();
