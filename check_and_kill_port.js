const { execSync } = require('child_process');

const ports = [3000, 3001, 3002];

for (const port of ports) {
  try {
    console.log(`Checking port ${port}...`);
    const pid = execSync(`lsof -t -i:${port}`).toString().trim();
    if (pid) {
      console.log(`Port ${port} is occupied by PID ${pid}. Killing it...`);
      execSync(`kill -9 ${pid}`);
      console.log(`PID ${pid} killed successfully.`);
    } else {
      console.log(`Port ${port} is free.`);
    }
  } catch (err) {
    console.log(`Port ${port} is free (or lsof failed).`);
  }
}
