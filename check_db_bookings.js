const axios = require('axios');

const supabaseUrl = 'https://nlrmsamgpajuprldkpms.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scm1zYW1ncGFqdXBybGRrcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0MDM2MSwiZXhwIjoyMDgzMTE2MzYxfQ.yJV4NIYrWhLfMlmH-cgr7AJsOp7daAZY11dyUhxw7lg';

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`
};

async function check() {
  try {
    const res = await axios.get(`${supabaseUrl}/rest/v1/user_profiles`, { headers });
    console.log("Profiles:", res.data.map(p => ({ id: p.id, phone: p.phone_number, role: p.user_type })));
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

check();
