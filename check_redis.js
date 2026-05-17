const Redis = require('/Users/karthiknaramala/Desktop/CusOwn/node_modules/ioredis');

async function checkRedis() {
  console.log("Connecting to Redis...");
  const redis = new Redis('redis://127.0.0.1:6379');
  
  redis.on('error', (err) => {
    console.error("Redis error:", err.message);
  });

  try {
    const res = await redis.ping();
    console.log("PING response:", res);
    if (res === 'PONG') {
      console.log("✅ Redis is active!");
      
      const keys = await redis.keys('*');
      console.log("Keys found:", keys);
      
      // Let's clear dashboard cache keys!
      const dashboardKeys = keys.filter(k => k.startsWith('dashboard:'));
      console.log("Dashboard keys to delete:", dashboardKeys);
      if (dashboardKeys.length > 0) {
        await redis.del(...dashboardKeys);
        console.log("✅ Deleted all dashboard keys!");
      }
    }
  } catch (err) {
    console.log("Redis not running or failed to connect.");
  } finally {
    redis.disconnect();
  }
}

checkRedis();
