/**
 * Port Cleanup Utility
 *
 * Kills any processes using the game server ports to prevent EADDRINUSE errors.
 * Run this script if you encounter "port already in use" errors.
 */

const { exec } = require("child_process");

const PORTS = [3000, 3001, 3002];

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    // Find process using the port
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is free`);
        resolve();
        return;
      }

      // Extract PID from netstat output
      const lines = stdout.trim().split("\n");
      const pids = new Set();

      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0" && !isNaN(pid)) {
          pids.add(pid);
        }
      });

      if (pids.size === 0) {
        console.log(`✅ Port ${port} is free`);
        resolve();
        return;
      }

      console.log(
        `🚨 Port ${port} is being used by PID(s): ${Array.from(pids).join(
          ", "
        )}`
      );

      // Kill each process
      const killPromises = Array.from(pids).map((pid) => {
        return new Promise((killResolve) => {
          exec(`taskkill /F /PID ${pid}`, (killError) => {
            if (killError) {
              console.log(`❌ Failed to kill PID ${pid}: ${killError.message}`);
            } else {
              console.log(`✅ Killed process ${pid}`);
            }
            killResolve();
          });
        });
      });

      Promise.all(killPromises).then(() => {
        console.log(`🧹 Cleaned up port ${port}`);
        resolve();
      });
    });
  });
}

async function cleanupAllPorts() {
  console.log("🧹 Starting port cleanup...");

  for (const port of PORTS) {
    await killProcessOnPort(port);
  }

  console.log("✅ Port cleanup completed!");
  console.log("You can now restart the server.");
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupAllPorts().catch(console.error);
}

module.exports = { cleanupAllPorts, killProcessOnPort };
