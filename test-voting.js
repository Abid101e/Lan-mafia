/**
 * Test script to simulate voting phase issue
 * Run this to trigger the voting phase and see debug logs
 */
const io = require("socket.io-client");

console.log("🧪 Starting voting phase test...");

// Connect multiple test clients
const clients = [];
const SERVER_URL = "http://localhost:3000";

function createTestClient(name, isHost = false) {
  const client = io(SERVER_URL);

  client.on("connect", () => {
    console.log(`✅ ${name} connected with socket ID: ${client.id}`);

    if (isHost) {
      // Create game as host
      client.emit("createGame", { name });
    } else {
      // Join as regular player
      setTimeout(() => {
        client.emit("joinGame", { name, gameCode: "TEST123" });
      }, 500);
    }
  });

  client.on("gamePhaseChanged", (phase) => {
    console.log(`🎮 ${name} received phase change: ${phase}`);
  });

  client.on("playersUpdated", (players) => {
    console.log(
      `👥 ${name} received players update:`,
      players.map((p) => ({
        name: p.name,
        socketId: p.socketId,
        isAlive: p.isAlive,
      }))
    );
  });

  client.on("roleAssigned", (role) => {
    console.log(`🎭 ${name} assigned role: ${role}`);
  });

  client.on("disconnect", () => {
    console.log(`❌ ${name} disconnected`);
  });

  return client;
}

// Create test scenario
const host = createTestClient("Host", true);
clients.push(host);

setTimeout(() => {
  clients.push(createTestClient("Player1"));
}, 1000);

setTimeout(() => {
  clients.push(createTestClient("Player2"));
}, 1500);

setTimeout(() => {
  clients.push(createTestClient("Player3"));
}, 2000);

// Start the game after all players join
setTimeout(() => {
  console.log("🚀 Starting game...");
  host.emit("startGame");
}, 3000);

// Skip to voting phase after roles are assigned
setTimeout(() => {
  console.log("⏭️ Skipping to voting phase...");
  // Simulate end of night phase
  host.emit("readyForVoting");
}, 8000);

// Cleanup after test
setTimeout(() => {
  console.log("🧪 Test completed, disconnecting clients...");
  clients.forEach((client) => client.disconnect());
  process.exit(0);
}, 15000);
