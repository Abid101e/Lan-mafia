/**
 * Test Script for Network Discovery
 *
 * This script tests the automatic IP detection functionality
 * to ensure it works correctly before deploying to the main app.
 */

const { networkInterfaces } = require("os");

console.log("🔍 Testing Network Discovery...\n");

// Test 1: Check available network interfaces
console.log("=== Network Interfaces ===");
const interfaces = networkInterfaces();
for (const [name, configs] of Object.entries(interfaces)) {
  console.log(`\n📡 Interface: ${name}`);
  configs.forEach((config, index) => {
    if (config.family === "IPv4" && !config.internal) {
      console.log(`  ✅ ${config.address} (External IPv4)`);
    } else if (config.family === "IPv4" && config.internal) {
      console.log(`  🏠 ${config.address} (Local IPv4)`);
    }
  });
}

// Test 2: Simulate the server's getLocalIPAddress function
function getLocalIPAddress() {
  const interfaces = networkInterfaces();
  const addresses = [];

  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        addresses.push(alias.address);
      }
    }
  }

  return addresses;
}

console.log("\n=== Available Host IPs ===");
const hostIPs = getLocalIPAddress();
if (hostIPs.length > 0) {
  hostIPs.forEach((ip) => {
    console.log(`✅ Available at: http://${ip}:3000`);
  });
} else {
  console.log("❌ No external IP addresses found");
}

// Test 3: Generate network ranges for scanning
function generateNetworkRanges() {
  const hostIPs = getLocalIPAddress();
  const ranges = new Set();

  hostIPs.forEach((ip) => {
    const parts = ip.split(".");
    if (parts.length === 4) {
      // Add the specific network range this IP belongs to
      const networkBase = `${parts[0]}.${parts[1]}.${parts[2]}.`;
      ranges.add(networkBase);
    }
  });

  return Array.from(ranges);
}

console.log("\n=== Network Ranges to Scan ===");
const ranges = generateNetworkRanges();
ranges.forEach((range) => {
  console.log(`🔍 Will scan: ${range}1-254`);
});

console.log("\n✅ Network Discovery Test Complete!");
console.log("\n📋 Summary:");
console.log(`   • Found ${hostIPs.length} host IP(s)`);
console.log(`   • Will scan ${ranges.length} network range(s)`);
console.log(
  `   • Server will be available at: ${hostIPs
    .map((ip) => `http://${ip}:3000`)
    .join(", ")}`
);
