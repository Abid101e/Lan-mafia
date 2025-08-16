/**
 * Logger Utility for LAN Mafia Server
 *
 * Provides centralized logging with different levels and formatting
 * for better debugging and monitoring.
 */

const fs = require("fs");
const path = require("path");

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === "true";
    this.logDir = path.join(__dirname, "..", "logs");

    // Performance optimizations
    this._timestampCache = null;
    this._timestampCacheTime = 0;
    this._logQueue = [];
    this._isWriting = false;

    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get timestamp string with caching for performance
   */
  getTimestamp() {
    const now = Date.now();
    // Cache timestamp for 1 second to avoid frequent Date object creation
    if (now - this._timestampCacheTime > 1000) {
      this._timestampCache = new Date(now).toISOString();
      this._timestampCacheTime = now;
    }
    return this._timestampCache;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
  }

  /**
   * Write to file if enabled (async queued for better performance)
   */
  writeToFile(formattedMessage) {
    if (!this.enableFileLogging) return;

    this._logQueue.push(formattedMessage);

    if (!this._isWriting) {
      this._processLogQueue();
    }
  }

  /**
   * Process log queue asynchronously
   */
  async _processLogQueue() {
    if (this._isWriting || this._logQueue.length === 0) return;

    this._isWriting = true;

    try {
      const filename = `server-${new Date().toISOString().split("T")[0]}.log`;
      const filepath = path.join(this.logDir, filename);

      // Process multiple log entries at once for better performance
      const messages = this._logQueue.splice(0, this._logQueue.length);
      const content = messages.join("\n") + "\n";

      await fs.promises.appendFile(filepath, content);
    } catch (error) {
      console.error("Failed to write log file:", error.message);
    } finally {
      this._isWriting = false;

      // Process any new logs that arrived while writing
      if (this._logQueue.length > 0) {
        setImmediate(() => this._processLogQueue());
      }
    }
  }

  /**
   * Log error message
   */
  error(message, data = null) {
    const formatted = this.formatMessage("error", message, data);
    console.error(`❌ ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (this.logLevel === "error") return;

    const formatted = this.formatMessage("warn", message, data);
    console.warn(`⚠️ ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    if (["error", "warn"].includes(this.logLevel)) return;

    const formatted = this.formatMessage("info", message, data);
    console.log(`INFO: ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (this.logLevel !== "debug") return;

    const formatted = this.formatMessage("debug", message, data);
    console.log(`DEBUG: ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log game event
   */
  game(message, data = null) {
    const formatted = this.formatMessage("game", message, data);
    console.log(`GAME: ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log player action
   */
  player(message, data = null) {
    const formatted = this.formatMessage("player", message, data);
    console.log(`PLAYER: ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log server event
   */
  server(message, data = null) {
    const formatted = this.formatMessage("server", message, data);
    console.log(`SERVER: ${formatted}`);
    this.writeToFile(formatted);
  }
}

// Export singleton instance
const logger = new Logger();
module.exports = logger;
