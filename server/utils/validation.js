/**
 * Validation Utilities for LAN Mafia Server
 *
 * Provides input validation and sanitization functions
 * to ensure data integrity and security.
 */

const config = require("../config");

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {Object} Validation result
 */
function validatePlayerName(name) {
  if (!name || typeof name !== "string") {
    return {
      valid: false,
      message: "Player name is required",
    };
  }

  const trimmedName = name.trim();

  // Use config values or fallback to defaults
  const minLength = config.get
    ? config.get("security.validation.minNameLength") || 2
    : 2;
  const maxLength = config.get
    ? config.get("security.validation.maxNameLength") || 20
    : 20;
  const allowedChars = config.get
    ? config.get("security.validation.allowedNameChars") ||
      /^[a-zA-Z0-9\s\-_\.]+$/
    : /^[a-zA-Z0-9\s\-_\.]+$/;

  if (trimmedName.length < minLength) {
    return {
      valid: false,
      message: `Player name must be at least ${minLength} characters long`,
    };
  }

  if (trimmedName.length > maxLength) {
    return {
      valid: false,
      message: `Player name must be less than ${maxLength} characters`,
    };
  }

  if (!allowedChars.test(trimmedName)) {
    return {
      valid: false,
      message: "Player name contains invalid characters",
    };
  }

  const inappropriateWords = [
    "admin",
    "server",
    "bot",
    "null",
    "undefined",
    "delete",
    "drop",
  ];
  const lowerName = trimmedName.toLowerCase();
  for (const word of inappropriateWords) {
    if (lowerName.includes(word)) {
      return {
        valid: false,
        message: "Player name contains restricted words",
      };
    }
  }

  return {
    valid: true,
    sanitizedName: trimmedName,
  };
}

/**
 * Validate game settings
 * @param {Object} settings - Game settings to validate
 * @returns {Object} Validation result
 */
function validateGameSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return {
      valid: false,
      message: "Invalid settings format",
    };
  }

  // Handle both flat and nested formats
  let roles, timers, totalPlayers;

  if (settings.roles) {
    // Nested format
    roles = settings.roles;
    timers = settings.timers || {};
    totalPlayers = settings.totalPlayers;
  } else {
    // Flat format (legacy)
    roles = {
      killers: settings.killers,
      healers: settings.healers,
      police: settings.police,
      townspeople: settings.townspeople,
    };
    timers = {
      nightTimer: settings.nightTimer,
      discussionTimer: settings.discussionTimer,
      votingTimer: settings.votingTimer,
    };
    totalPlayers = settings.totalPlayers;
  }

  // Check if roles object exists and has properties
  if (!roles || typeof roles !== "object") {
    return {
      valid: false,
      message: "Invalid settings format - roles missing",
    };
  }

  // Validate total players (allowing 3 for testing)
  if (totalPlayers !== undefined) {
    if (
      !Number.isInteger(totalPlayers) ||
      totalPlayers < 3 || // Changed from 4 to 3 for testing
      totalPlayers > 20
    ) {
      return {
        valid: false,
        message: "Total players must be between 3 and 20 (testing mode)",
      };
    }
  }

  // Validate roles using helper function
  const roleValidationRules = [
    { name: "killers", value: roles.killers, min: 1, max: 5, required: true },
    { name: "healers", value: roles.healers, min: 0, max: 3, required: false },
    { name: "police", value: roles.police, min: 0, max: 2, required: false },
    {
      name: "townspeople",
      value: roles.townspeople,
      min: 0,
      max: Infinity,
      required: false,
    },
  ];

  for (const rule of roleValidationRules) {
    if (rule.value !== undefined) {
      if (
        !Number.isInteger(rule.value) ||
        rule.value < rule.min ||
        rule.value > rule.max
      ) {
        return {
          valid: false,
          message: `${
            rule.name.charAt(0).toUpperCase() + rule.name.slice(1)
          } must be between ${rule.min} and ${
            rule.max === Infinity ? "unlimited" : rule.max
          }`,
        };
      }
    }
  }

  // Special case for 3-player testing: allow 0 townspeople
  if (totalPlayers === 3 && roles.townspeople === 0) {
    // Allow 0 townspeople for 3-player testing
  } else if (roles.townspeople !== undefined && roles.townspeople < 1) {
    return {
      valid: false,
      message:
        "Must have at least 1 townsperson (except in 3-player testing mode)",
    };
  }

  // Validate timers if they exist
  if (timers && typeof timers === "object") {
    const timerRules = [
      { name: "nightTimer", value: timers.nightTimer, min: 15, max: 300 },
      {
        name: "discussionTimer",
        value: timers.discussionTimer,
        min: 30,
        max: 600,
      },
      { name: "votingTimer", value: timers.votingTimer, min: 15, max: 300 },
    ];

    for (const timer of timerRules) {
      if (
        timer.value !== undefined &&
        (!Number.isInteger(timer.value) ||
          timer.value < timer.min ||
          timer.value > timer.max)
      ) {
        return {
          valid: false,
          message: `${timer.name
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()
            .trim()} must be between ${timer.min} and ${timer.max} seconds`,
        };
      }
    }
  }

  return {
    valid: true,
    message: "Game settings are valid",
  };
}

/**
 * Validate room code format
 * @param {string} roomCode - Room code to validate
 * @returns {Object} Validation result
 */
function validateRoomCode(roomCode) {
  if (!roomCode || typeof roomCode !== "string") {
    return {
      valid: false,
      message: "Room code is required",
    };
  }

  const trimmedCode = roomCode.trim().toUpperCase();

  if (trimmedCode.length !== 6) {
    return {
      valid: false,
      message: "Room code must be exactly 6 characters",
    };
  }

  if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
    return {
      valid: false,
      message: "Room code must contain only letters and numbers",
    };
  }

  return {
    valid: true,
    sanitizedCode: trimmedCode,
  };
}

/**
 * Validate player action
 * @param {string} action - Action type
 * @param {string} playerId - Player performing action
 * @param {string} targetId - Target of action (optional)
 * @returns {Object} Validation result
 */
function validatePlayerAction(action, playerId, targetId = null) {
  const validActions = ["kill", "heal", "investigate", "vote"];

  if (!validActions.includes(action)) {
    return {
      valid: false,
      message: "Invalid action type",
    };
  }

  if (!playerId || typeof playerId !== "string") {
    return {
      valid: false,
      message: "Invalid player ID",
    };
  }

  if (["kill", "heal", "investigate", "vote"].includes(action) && !targetId) {
    return {
      valid: false,
      message: "Target is required for this action",
    };
  }

  if (targetId && playerId === targetId && !["heal"].includes(action)) {
    return {
      valid: false,
      message: "Cannot target yourself for this action",
    };
  }

  return { valid: true };
}

module.exports = {
  validatePlayerName,
  validateGameSettings,
  validateRoomCode,
  validatePlayerAction,
};
