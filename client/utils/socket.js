/**
 * Socket Connection Manager for LAN Mafia Game
 *
 * Handles all WebSocket communication between client and host server.
 * Provides connection management, event handling, and reconnection logic.
 *
 * Features:
 * - Automatic connection management
 * - Event emission and listening
 * - Connection state tracking
 * - Error handling and reconnection
 * - Host discovery and connection
 * - Automatic IP detection
 */
/**
 * Initializes and exports the Socket.IO client connection.
 * Handles:
 * - Connection to host device using automatic IP detection
 * - Emitting player actions
 * - Listening for game updates, role data, and phase changes
 */

import { io } from "socket.io-client";
import { networkDiscovery } from "./networkDiscovery";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.hostIP = null;
    // Performance optimizations
    this._eventHandlers = new Map();
    this._connectionCache = new Map();
    this._reconnectTimeout = null;
    // Custom event emitter for manager-level events
    this._customEventListeners = new Map();
  }

  /**
   * Add a custom event listener for manager-level events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  addCustomListener(event, callback) {
    if (!this._customEventListeners.has(event)) {
      this._customEventListeners.set(event, []);
    }
    this._customEventListeners.get(event).push(callback);
  }

  /**
   * Remove a custom event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function to remove
   */
  removeCustomListener(event, callback) {
    if (!this._customEventListeners.has(event)) return;
    const listeners = this._customEventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit a custom event
   * @param {string} event - Event name
   * @param {*} data - Data to emit
   */
  emitCustomEvent(event, data) {
    if (!this._customEventListeners.has(event)) return;
    const listeners = this._customEventListeners.get(event);
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in custom event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Connect to host server with caching
   * @param {string} hostIP - IP address of the host server
   * @param {number} port - Port number (default: 3000)
   */
  connect(hostIP, port = 3000) {
    try {
      this.hostIP = hostIP;
      const serverURL = `http://${hostIP}:${port}`;

      // Check if we already have a working connection to this host
      const cacheKey = `${hostIP}:${port}`;
      if (this._connectionCache.has(cacheKey) && this.socket?.connected) {
        console.log(`Reusing existing connection to: ${serverURL}`);
        return this.socket;
      }

      // Disconnect existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new socket connection
      this.socket = io(serverURL, {
        timeout: 10000, // Increased timeout
        reconnection: true,
        reconnectionAttempts: 3, // Reduced attempts for faster failover
        reconnectionDelay: 1000,
        forceNew: true, // Force new connection
        transports: ["websocket", "polling"], // Allow fallback to polling
      });

      console.log(`Attempting to connect to: ${serverURL}`);

      // Cache the connection
      this._connectionCache.set(cacheKey, true);

      // Set up connection event handlers
      this.setupEventHandlers();

      return this.socket;
    } catch (error) {
      console.error("Socket connection error:", error);
      throw error;
    }
  }

  /**
   * Set up socket event handlers with caching
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Cache frequently used handlers to avoid recreation
    if (!this._eventHandlers.has("connect")) {
      this._eventHandlers.set("connect", () => {
        this.isConnected = true;
        console.log(`✅ Successfully connected to host server: ${this.hostIP}`);
      });
    }

    if (!this._eventHandlers.has("disconnect")) {
      this._eventHandlers.set("disconnect", (reason) => {
        this.isConnected = false;
        console.log(`❌ Disconnected from host server. Reason: ${reason}`);
      });
    }

    if (!this._eventHandlers.has("connect_error")) {
      this._eventHandlers.set("connect_error", (error) => {
        console.error(
          `❌ Connection error to ${this.hostIP}:`,
          error.message || error
        );
        this.isConnected = false;
      });
    }

    if (!this._eventHandlers.has("reconnect")) {
      this._eventHandlers.set("reconnect", (attemptNumber) => {
        console.log(
          `🔄 Reconnected to ${this.hostIP} after ${attemptNumber} attempts`
        );
        this.isConnected = true;
      });
    }

    if (!this._eventHandlers.has("reconnect_error")) {
      this._eventHandlers.set("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
      });
    }

    // Attach cached handlers
    this.socket.on("connect", this._eventHandlers.get("connect"));
    this.socket.on("disconnect", this._eventHandlers.get("disconnect"));
    this.socket.on("connect_error", this._eventHandlers.get("connect_error"));
    this.socket.on("reconnect", this._eventHandlers.get("reconnect"));
    this.socket.on(
      "reconnect_error",
      this._eventHandlers.get("reconnect_error")
    );
  }

  /**
   * Scan for available games on local network with automatic IP detection
   */
  async scanForGames() {
    if (this.socket && this.isConnected) {
      console.log("Scanning for games on connected socket...");
      this.socket.emit("scanForGames");
      return;
    }

    console.log("Not connected, starting network game discovery...");

    try {
      // Use comprehensive game scanning
      const discoveredGames = await networkDiscovery.scanForGamesOnNetwork();

      if (discoveredGames.length === 0) {
        console.log("❌ No games found on the network");
        this.emitCustomEvent("gameListUpdated", []);
        this.emitCustomEvent("noHostsFound");
        return;
      }

      console.log(
        `🎮 Found ${discoveredGames.length} game(s):`,
        discoveredGames
      );

      // Emit the games list to the UI
      this.emitCustomEvent("gameListUpdated", discoveredGames);

      // Try connecting to the first available game host
      const firstGame = discoveredGames[0];
      const hostIP = firstGame.hostIP || firstGame.discoveredAt;

      if (hostIP) {
        console.log(`🎯 Auto-connecting to game host: ${hostIP}`);
        this.connect(hostIP);

        // Wait for connection and setup
        setTimeout(() => {
          if (this.socket && this.isConnected) {
            console.log("✅ Auto-connected to game host successfully");
            // Re-emit scanForGames to get updated list via socket
            this.socket.emit("scanForGames");
          } else {
            console.log(
              "❌ Failed to auto-connect, but games are available for manual connection"
            );
          }
        }, 2000);
      }
    } catch (error) {
      console.error("🚨 Error during game discovery:", error);
      this.emitCustomEvent("gameListUpdated", []);
      this.fallbackToManualConnection();
    }
  }

  /**
   * Try connecting to alternative hosts if the best host fails
   */
  async tryAlternativeHosts(alternativeHosts) {
    for (const hostIP of alternativeHosts) {
      try {
        console.log(`🔄 Trying alternative host: ${hostIP}`);
        this.connect(hostIP);

        // Wait and check if connection succeeded
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (this.socket && this.isConnected) {
          console.log(
            `✅ Successfully connected to alternative host: ${hostIP}`
          );
          this.socket.emit("scanForGames");
          return;
        }
      } catch (error) {
        console.log(`❌ Failed to connect to ${hostIP}:`, error.message);
      }
    }

    console.log("❌ All discovered hosts failed, trying fallback connection");
    this.fallbackToManualConnection();
  }

  /**
   * Fallback to manual connection attempt with common IPs
   */
  fallbackToManualConnection() {
    console.log("🔧 Falling back to manual connection attempt...");
    // Use localhost as last resort
    this.connect("localhost");
    setTimeout(() => {
      if (this.socket && this.isConnected) {
        console.log("Connected via fallback, scanning for games...");
        this.socket.emit("scanForGames");
      } else {
        console.log("❌ All connection attempts failed");
      }
    }, 2000);
  }

  /**
   * Join a specific game by code
   */
  joinGameByCode(gameCode, playerName) {
    if (this.socket && this.isConnected) {
      this.socket.emit("joinGameByCode", { gameCode, playerName });
    } else {
      throw new Error("Not connected to any server");
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  }

  /**
   * Listen for events from server or custom manager events
   * @param {string} event - Event name
   * @param {function} callback - Event handler function
   */
  on(event, callback) {
    // Handle custom manager events
    if (
      event === "noHostsFound" ||
      event === "hostDiscoveryStarted" ||
      event === "hostDiscoveryComplete" ||
      event === "gameListUpdated"
    ) {
      this.addCustomListener(event, callback);
      return;
    }

    // Handle regular socket events
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Store the listener for when socket is created
      this.addCustomListener(`pending_${event}`, callback);
    }
  }

  /**
   * Remove event listener for both socket and custom events
   * @param {string} event - Event name
   * @param {function} callback - Event handler function (optional)
   */
  off(event, callback) {
    // Handle custom manager events
    if (
      event === "noHostsFound" ||
      event === "hostDiscoveryStarted" ||
      event === "hostDiscoveryComplete" ||
      event === "gameListUpdated"
    ) {
      this.removeCustomListener(event, callback);
      return;
    }

    // Handle regular socket events
    if (this.socket) {
      this.socket.off(event, callback);
    }

    // Also remove pending listeners
    this.removeCustomListener(`pending_${event}`, callback);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.hostIP = null;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get current host IP
   * @returns {string|null} Host IP address
   */
  getHostIP() {
    return this.hostIP;
  }
}

// Export singleton instance
export const socket = new SocketManager();
export default socket;
