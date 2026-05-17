const axios = require('axios');

async function testStats() {
  const loginUrl = 'http://localhost:3000/api/auth/login';
  const dashboardUrl = 'http://localhost:3000/api/owner/dashboard';

  try {
    console.log("Logging in to get JWT token...");
    const loginRes = await axios.post(loginUrl, {
      whatsapp_number: "+918179299096",
      role: "owner"
    });
  } catch (err) {
    console.error("Full Axios Error Keys:", Object.keys(err));
    console.error("Error Message:", err.message);
    if (err.response) {
      console.error("Response Status:", err.response.status);
      console.error("Response Data:", err.response.data);
    } else {
      console.error("No response received.");
    }
  }
}

testStats();
