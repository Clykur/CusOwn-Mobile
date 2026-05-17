const axios = require('/Users/karthiknaramala/Desktop/CusOwn/node_modules/axios');
const jwt = require('/Users/karthiknaramala/Desktop/CusOwn/apps/app/node_modules/jsonwebtoken');

const ownerId = '640f8455-7bf5-494b-a725-9c55ed34322b';
const tokenSecret = 'baa24339cad15c6d4db02138e8dac9a5f2aa4b7fc5933a05b201e3123b6286a8';

// Create a valid token
const token = jwt.sign(
  {
    sub: ownerId,
    email: 'karthiknaramala3@gmail.com',
    role: 'owner',
    user_metadata: {
      role: 'owner'
    }
  },
  tokenSecret,
  { expiresIn: '1h' }
);

async function run() {
  console.log("Fetching health from http://localhost:3000/api/health...");
  try {
    const healthRes = await axios.get('http://localhost:3000/api/health');
    console.log("Health API response:", JSON.stringify(healthRes.data, null, 2));
  } catch (err) {
    console.error("Health API failed:", err.message);
  }

  console.log("\nFetching dashboard from http://localhost:3000/api/owner/dashboard...");
  try {
    const apiRes = await axios.get('http://localhost:3000/api/owner/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Dashboard API response stats & counts:");
    console.log("Total Businesses:", apiRes.data.data.stats.totalBusinesses);
    console.log("Total Bookings:", apiRes.data.data.stats.totalBookings);
    console.log("Todays Bookings length:", apiRes.data.data.todaysBookings?.length);
    console.log("Recent Bookings length:", apiRes.data.data.recentBookings?.length);
  } catch (err) {
    console.error("Dashboard API failed:", err.response ? err.response.data : err.message);
  }
}

run();
