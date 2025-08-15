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
 */
/**
 * Initializes and exports the Socket.IO client connection.
 * Handles:
 * - Connection to host device using local IP
 * - Emitting player actions
 * - Listening for game updates, role data, and phase changes
 */

import { io } from "socket.io-client";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.hostIP = null;
  }

  /**
   * Connect to host server
   * @param {string} hostIP - IP address of the host server
   * @param {number} port - Port number (default: 3000)
   */
  connect(hostIP, port = 3000) {
    try {
      this.hostIP = hostIP;
      const serverURL = `http://${hostIP}:${port}`;

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

      // Set up connection event handlers
      this.setupEventHandlers();

      return this.socket;
    } catch (error) {
      console.error("Socket connection error:", error);
      throw error;
    }
  }

  /**
   * Set up socket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log(`✅ Successfully connected to host server: ${this.hostIP}`);
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log(`❌ Disconnected from host server. Reason: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error(
        `❌ Connection error to ${this.hostIP}:`,
        error.message || error
      );
      this.isConnected = false;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(
        `🔄 Reconnected to ${this.hostIP} after ${attemptNumber} attempts`
      );
      this.isConnected = true;
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });
  }

  /**
   * Scan for available games on local network
   */
  scanForGames() {
    if (this.socket && this.isConnected) {
      console.log("Scanning for games on connected socket...");
      this.socket.emit("scanForGames");
    } else {
      // If not connected, try connecting to your machine's IP first
      console.log("Not connected, attempting to connect first...");
      this.connect("10.220.54.130"); // Use correct IP
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          console.log("Connected, now scanning for games...");
          this.socket.emit("scanForGames");
        } else {
          console.log("Failed to connect for game scanning");
        }
      }, 2000); // Increased timeout
    }
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
   * Listen for events from server
   * @param {string} event - Event name
   * @param {function} callback - Event handler function
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Event handler function (optional)
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
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
