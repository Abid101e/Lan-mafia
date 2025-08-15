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

    // Create logs directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get timestamp string
   */
  getTimestamp() {
    return new Date().toISOString();
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
   * Write to file if enabled
   */
  writeToFile(formattedMessage) {
    if (!this.enableFileLogging) return;

    const filename = `server-${new Date().toISOString().split("T")[0]}.log`;
    const filepath = path.join(this.logDir, filename);

    fs.appendFileSync(filepath, formattedMessage + "\n");
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
    console.log(`ℹ️ ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (this.logLevel !== "debug") return;

    const formatted = this.formatMessage("debug", message, data);
    console.log(`🐛 ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log game event
   */
  game(message, data = null) {
    const formatted = this.formatMessage("game", message, data);
    console.log(`🎮 ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log player action
   */
  player(message, data = null) {
    const formatted = this.formatMessage("player", message, data);
    console.log(`👤 ${formatted}`);
    this.writeToFile(formatted);
  }

  /**
   * Log server event
   */
  server(message, data = null) {
    const formatted = this.formatMessage("server", message, data);
    console.log(`🖥️ ${formatted}`);
    this.writeToFile(formatted);
  }
}

// Export singleton instance
const logger = new Logger();
module.exports = logger;
