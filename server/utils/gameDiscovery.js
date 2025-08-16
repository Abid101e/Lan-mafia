/**
 * Network Discovery Service for LAN Mafia Game
 *
 * Handles automatic game discovery on local network using UDP broadcasting.
 * Allows players to find games without manual IP input.
 */

const dgram = require("dgram");
const os = require("os");
const EventEmitter = require("events");

class GameDiscoveryService extends EventEmitter {
  constructor() {
    super();
    this.broadcastPort = 3001;
    this.discoveryPort = 3002;
    this.server = null;
    this.client = null;
    this.gameInfo = null;
    this.isHosting = false;
    this.heartbeatInterval = null;

    // Performance optimizations
    this._localIPCache = null;
    this._localIPCacheTime = 0;
    this._responseBuffer = null;
  }

  /**
   * Get local IP address with caching
   */
  getLocalIP() {
    const now = Date.now();
    // Cache IP for 30 seconds to avoid repeated network interface lookups
    if (now - this._localIPCacheTime > 30000) {
      const interfaces = os.networkInterfaces();
      for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (
            alias.family === "IPv4" &&
            alias.address !== "127.0.0.1" &&
            !alias.internal
          ) {
            this._localIPCache = alias.address;
            this._localIPCacheTime = now;
            return this._localIPCache;
          }
        }
      }
      this._localIPCache = "127.0.0.1";
      this._localIPCacheTime = now;
    }
    return this._localIPCache;
  }

  /**
   * Start hosting a game - broadcast game availability
   */
  startHosting(gameInfo) {
    this.gameInfo = {
      gameCode: gameInfo.gameCode,
      hostName: gameInfo.hostName,
      playerCount: gameInfo.playerCount || 1,
      maxPlayers: gameInfo.maxPlayers || 8,
      status: "waiting",
      hostIP: this.getLocalIP(),
      port: 3000,
      timestamp: Date.now(),
    };

    this.isHosting = true;

    // Pre-build response buffer for better performance
    this._updateResponseBuffer();

    // Start UDP server for responding to discovery requests
    this.server = dgram.createSocket("udp4");

    this.server.on("error", (err) => {
      console.error("🚨 Game discovery server error:", err.message);
      if (err.code === "EADDRINUSE") {
        console.log(
          `⚠️  Port ${this.discoveryPort} is already in use. Trying alternative port...`
        );
        // Try alternative port
        this.discoveryPort = this.discoveryPort + 1;
        setTimeout(() => {
          this.startHosting(gameInfo);
        }, 1000);
        return;
      }
      // For other errors, stop hosting
      this.stopHosting();
    });

    this.server.on("message", (msg, rinfo) => {
      try {
        const request = JSON.parse(msg.toString());
        if (request.type === "DISCOVER_GAMES" && this._responseBuffer) {
          // Send pre-built response for better performance
          this.server.send(this._responseBuffer, rinfo.port, rinfo.address);
        }
      } catch (error) {
        console.log("Discovery request error:", error.message);
      }
    });

    this.server.bind(this.discoveryPort, () => {
      console.log(
        `🔊 Game discovery server started on port ${this.discoveryPort}`
      );
      console.log(
        `📡 Broadcasting game: ${this.gameInfo.gameCode} by ${this.gameInfo.hostName}`
      );
    });

    // Send periodic heartbeat broadcasts
    this.startHeartbeat();
  }

  /**
   * Update response buffer for optimized sending
   */
  _updateResponseBuffer() {
    if (this.gameInfo) {
      const response = {
        type: "GAME_AVAILABLE",
        game: this.gameInfo,
      };
      this._responseBuffer = Buffer.from(JSON.stringify(response));
    }
  }

  /**
   * Update game info (player count, status, etc.)
   */
  updateGameInfo(updates) {
    if (this.gameInfo) {
      this.gameInfo = { ...this.gameInfo, ...updates, timestamp: Date.now() };
      // Update response buffer when game info changes
      this._updateResponseBuffer();
    }
  }

  /**
   * Start heartbeat broadcasting
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isHosting && this.gameInfo) {
        this.broadcastGameAvailable();
      }
    }, 5000); // Broadcast every 5 seconds
  }

  /**
   * Broadcast game availability to local network
   */
  broadcastGameAvailable() {
    const client = dgram.createSocket("udp4");

    client.on("error", (err) => {
      console.log("Broadcast client error:", err.message);
      client.close();
    });

    client.bind(() => {
      client.setBroadcast(true);

      const message = {
        type: "GAME_HEARTBEAT",
        game: this.gameInfo,
      };

      const msgBuffer = Buffer.from(JSON.stringify(message));
      client.send(msgBuffer, this.broadcastPort, "255.255.255.255", (err) => {
        client.close();
        if (err) {
          console.log("Broadcast error:", err.message);
        }
      });
    });
  }

  /**
   * Scan for available games on local network
   */
  scanForGames(timeout = 3000) {
    return new Promise((resolve) => {
      const games = [];
      const client = dgram.createSocket("udp4");

      // Listen for responses
      client.on("message", (msg, rinfo) => {
        try {
          const response = JSON.parse(msg.toString());
          if (response.type === "GAME_AVAILABLE" && response.game) {
            // Avoid duplicate games
            const existing = games.find(
              (g) => g.gameCode === response.game.gameCode
            );
            if (!existing) {
              games.push(response.game);
            }
          }
        } catch (error) {
          console.log("Scan response error:", error.message);
        }
      });

      // Also listen for heartbeat broadcasts
      const broadcastListener = dgram.createSocket("udp4");
      broadcastListener.on("message", (msg, rinfo) => {
        try {
          const broadcast = JSON.parse(msg.toString());
          if (broadcast.type === "GAME_HEARTBEAT" && broadcast.game) {
            const existing = games.find(
              (g) => g.gameCode === broadcast.game.gameCode
            );
            if (!existing) {
              games.push(broadcast.game);
            }
          }
        } catch (error) {
          console.log("Heartbeat listen error:", error.message);
        }
      });

      client.bind(() => {
        // Send discovery request
        const request = {
          type: "DISCOVER_GAMES",
          timestamp: Date.now(),
        };

        const msgBuffer = Buffer.from(JSON.stringify(request));

        // Broadcast discovery request to entire subnet
        client.setBroadcast(true);
        client.send(msgBuffer, this.discoveryPort, "255.255.255.255");
      });

      broadcastListener.bind(this.broadcastPort);

      // Resolve after timeout
      setTimeout(() => {
        client.close();
        broadcastListener.close();
        resolve(games);
      }, timeout);
    });
  }

  /**
   * Stop hosting and clean up
   */
  stopHosting() {
    this.isHosting = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    if (this.client) {
      this.client.close();
      this.client = null;
    }

    console.log("🔇 Game discovery stopped");
  }

  /**
   * Get current hosting status
   */
  getStatus() {
    return {
      isHosting: this.isHosting,
      gameInfo: this.gameInfo,
      localIP: this.getLocalIP(),
    };
  }
}

module.exports = new GameDiscoveryService();
