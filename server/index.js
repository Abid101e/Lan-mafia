/**
 * Main Server Entry Point for LAN Mafia Game
 *
 * Starts the Express server with Socket.io for real-time communication.
 * Handles HTTP requests and WebSocket connections for the game.
 *
 * Server responsibilities:
 * - Host the game session
 * - Manage player connections
 * - Process game logic and state changes
 * - Broadcast updates to all clients
 * - Handle role assignments and actions
 */
/**
 * Entry point for LAN Mafia backend.
 * Starts an Express server and attaches a Socket.IO server for LAN communication.
 * Loads event listeners from socketEvents.js.
 */

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupSocketEvents } = require("./socketEvents");
const gameState = require("./state");
const gameDiscovery = require("./utils/gameDiscovery");
const logger = require("./utils/logger");
const {
  sendErrorResponse,
  setupGlobalErrorHandlers,
} = require("./utils/errorHandler");
const {
  runAllTests,
  generateTestPlayers,
  simulateGame,
} = require("./utils/testing");
const config = require("./config");

const app = express();
const server = http.createServer(app);

// Initialize configuration
config.initialize();

// Setup global error handlers
setupGlobalErrorHandlers();

// Configure CORS for cross-origin requests
app.use(cors(config.get("server.cors")));

app.use(express.json());

// Create Socket.io server with CORS configuration
const io = new Server(server, {
  cors: config.get("server.cors"),
  transports: config.get("server.socketio.transports"),
  pingTimeout: config.get("server.socketio.pingTimeout"),
  pingInterval: config.get("server.socketio.pingInterval"),
});

// Basic HTTP endpoint for health check
app.get("/", (req, res) => {
  try {
    res.json({
      message: "LAN Mafia Game Server",
      status: "running",
      players: gameState.getPlayerCount(),
      gamePhase: gameState.getCurrentPhase(),
      version: "1.0.0",
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

// Get current game state endpoint
app.get("/game-state", (req, res) => {
  try {
    res.json({
      players: gameState.getPlayers(),
      phase: gameState.getCurrentPhase(),
      settings: gameState.getSettings(),
      isGameActive: gameState.isGameActive(),
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

// Development endpoints (only available in non-production)
if (process.env.NODE_ENV !== "production") {
  // Test endpoint for running server tests
  app.get("/test", (req, res) => {
    try {
      const results = runAllTests();
      res.json({
        success: true,
        testResults: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });

  // Generate test players endpoint
  app.post("/dev/test-players", (req, res) => {
    try {
      const count = req.body.count || 6;
      const players = generateTestPlayers(count);
      res.json({
        success: true,
        players,
        message: `Generated ${players.length} test players`,
      });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });

  // Simulate game endpoint
  app.post("/dev/simulate-game", (req, res) => {
    try {
      const result = simulateGame();
      res.json(result);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });

  // Reset game state endpoint
  app.post("/dev/reset", (req, res) => {
    try {
      gameState.reset();
      res.json({
        success: true,
        message: "Game state reset successfully",
      });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
}

// Setup all socket event handlers
setupSocketEvents(io);

// Get local IP addresses for connection info
function getLocalIPAddress() {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

// Start the server
const PORT = config.get("server.port");
const HOST = config.get("server.host");
server.listen(PORT, HOST, () => {
  const localIPs = getLocalIPAddress();

  logger.server("LAN Mafia Game Server Started");
  logger.server(`Server running on port ${PORT}`);
  logger.server("Available on:");
  logger.server(`   - http://localhost:${PORT}`);

  localIPs.forEach((ip) => {
    logger.server(`   - http://${ip}:${PORT}`);
  });

  logger.server("Players can connect using any of the above IP addresses");
  logger.server("Use Ctrl+C to stop the server");
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  logger.server("Shutting down LAN Mafia server...");

  // Stop game discovery service to free UDP ports
  gameDiscovery.stopHosting();

  // Notify all connected clients
  io.emit("serverShutdown", { message: "Server is shutting down" });

  // Close server connections
  server.close(() => {
    logger.server("Server stopped successfully");
    process.exit(0);
  });
});

// Error handling is now managed by setupGlobalErrorHandlers()

module.exports = { app, server, io };
