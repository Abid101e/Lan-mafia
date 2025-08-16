/**
 * Server Configuration for LAN Mafia
 *
 * Centralized configuration management for server settings,
 * environment variables, and feature flags.
 */

const path = require("path");

/**
 * Server configuration object
 */
const config = {
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || "0.0.0.0",
    environment: process.env.NODE_ENV || "development",

    // CORS settings
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },

    // Socket.io settings
    socketio: {
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    },
  },

  // Game settings
  game: {
    // Player limits
    maxPlayers: parseInt(process.env.MAX_PLAYERS) || 20,
    minPlayers: parseInt(process.env.MIN_PLAYERS) || 4,

    // Default timers (in seconds)
    defaultTimers: {
      roleReveal: 10,
      night: 30,
      discussion: 120,
      voting: 60,
      results: 5,
    },

    // Game rules
    defaultRules: {
      allowSelfHeal: false,
      revealRoleOnDeath: true,
      allowSpectatorChat: false,
      randomizeRoleOrder: true,
    },

    // Role limits
    roleLimits: {
      killers: { min: 1, max: 5 },
      healers: { min: 0, max: 3 },
      police: { min: 0, max: 2 },
    },
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === "true",
    logDirectory: path.join(__dirname, "..", "logs"),
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 7,
    maxLogSize: process.env.MAX_LOG_SIZE || "10MB",
  },

  // Security settings
  security: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP",
    },

    // Input validation
    validation: {
      maxNameLength: 20,
      minNameLength: 2,
      allowedNameChars: /^[a-zA-Z0-9\s\-_\.]+$/,
      maxMessageLength: 500,
    },
  },

  // Development settings
  development: {
    enableTestEndpoints: process.env.NODE_ENV !== "production",
    enableDebugLogs: process.env.ENABLE_DEBUG === "true",
    mockData: process.env.USE_MOCK_DATA === "true",
  },

  // Performance settings
  performance: {
    // Cleanup intervals (in milliseconds)
    gameCleanupInterval: 30 * 60 * 1000, // 30 minutes
    disconnectedPlayerTimeout: 5 * 60 * 1000, // 5 minutes

    // Memory limits
    maxConcurrentGames: parseInt(process.env.MAX_CONCURRENT_GAMES) || 10,
    maxHistoryEntries: parseInt(process.env.MAX_HISTORY_ENTRIES) || 100,
  },
};

// Configuration cache for performance
const configCache = new Map();

/**
 * Get configuration value by path
 * @param {string} path - Dot notation path (e.g., 'server.port')
 * @returns {*} Configuration value
 */
function get(path) {
  // Check cache first
  if (configCache.has(path)) {
    return configCache.get(path);
  }

  const keys = path.split(".");
  let value = config;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  // Cache the result for frequently accessed paths
  if (value !== undefined) {
    configCache.set(path, value);
  }

  return value;
}

/**
 * Set configuration value by path
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 */
function set(path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let obj = config;

  for (const key of keys) {
    if (!(key in obj) || typeof obj[key] !== "object") {
      obj[key] = {};
    }
    obj = obj[key];
  }

  obj[lastKey] = value;

  // Invalidate cache for this path and any parent paths
  configCache.delete(path);

  // Also invalidate any cached paths that start with this path
  for (const cachedPath of configCache.keys()) {
    if (cachedPath.startsWith(path + ".")) {
      configCache.delete(cachedPath);
    }
  }
}

/**
 * Validate configuration
 */
function validate() {
  const errors = [];

  // Validate required settings
  if (
    !config.server.port ||
    config.server.port < 1 ||
    config.server.port > 65535
  ) {
    errors.push("Invalid server port");
  }

  if (config.game.maxPlayers < config.game.minPlayers) {
    errors.push("Max players cannot be less than min players");
  }

  if (config.game.roleLimits.killers.min < 1) {
    errors.push("Must have at least 1 killer");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Load configuration from environment
 */
function loadFromEnvironment() {
  // Override config with environment variables
  const envMappings = {
    PORT: "server.port",
    HOST: "server.host",
    MAX_PLAYERS: "game.maxPlayers",
    MIN_PLAYERS: "game.minPlayers",
    LOG_LEVEL: "logging.level",
  };

  Object.entries(envMappings).forEach(([envVar, configPath]) => {
    const envValue = process.env[envVar];
    if (envValue !== undefined) {
      set(configPath, envValue);
    }
  });
}

/**
 * Get environment-specific configuration
 */
function getEnvironmentConfig() {
  const env = config.server.environment;

  const envConfigs = {
    development: {
      logging: { level: "debug" },
      development: { enableDebugLogs: true },
    },
    production: {
      logging: { level: "info" },
      development: { enableTestEndpoints: false },
    },
    test: {
      logging: { level: "error" },
      server: { port: 0 }, // Use random port for testing
    },
  };

  return envConfigs[env] || {};
}

/**
 * Initialize configuration
 */
function initialize() {
  // Load environment variables
  loadFromEnvironment();

  // Apply environment-specific config
  const envConfig = getEnvironmentConfig();
  Object.keys(envConfig).forEach((section) => {
    Object.assign(config[section], envConfig[section]);
  });

  // Validate configuration
  const validation = validate();
  if (!validation.valid) {
    throw new Error(
      `Configuration validation failed: ${validation.errors.join(", ")}`
    );
  }

  return config;
}

module.exports = {
  config,
  get,
  set,
  validate,
  initialize,
};
