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

  // Check for valid characters (letters, numbers, spaces, basic symbols)
  if (!allowedChars.test(trimmedName)) {
    return {
      valid: false,
      message: "Player name contains invalid characters",
    };
  }

  // Check for inappropriate words (basic filter)
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

  // Validate total players
  if (settings.totalPlayers !== undefined) {
    if (
      !Number.isInteger(settings.totalPlayers) ||
      settings.totalPlayers < 4 ||
      settings.totalPlayers > 20
    ) {
      return {
        valid: false,
        message: "Total players must be between 4 and 20",
      };
    }
  }

  // Validate roles
  if (settings.roles) {
    const { killers, healers, police, townspeople } = settings.roles;

    if (
      killers !== undefined &&
      (!Number.isInteger(killers) || killers < 1 || killers > 5)
    ) {
      return {
        valid: false,
        message: "Killers must be between 1 and 5",
      };
    }

    if (
      healers !== undefined &&
      (!Number.isInteger(healers) || healers < 0 || healers > 3)
    ) {
      return {
        valid: false,
        message: "Healers must be between 0 and 3",
      };
    }

    if (
      police !== undefined &&
      (!Number.isInteger(police) || police < 0 || police > 2)
    ) {
      return {
        valid: false,
        message: "Police must be between 0 and 2",
      };
    }

    if (
      townspeople !== undefined &&
      (!Number.isInteger(townspeople) || townspeople < 1)
    ) {
      return {
        valid: false,
        message: "Must have at least 1 townsperson",
      };
    }
  }

  // Validate timers
  if (settings.timers) {
    const { nightTimer, discussionTimer, votingTimer, roleRevealTimer } =
      settings.timers;

    if (
      nightTimer !== undefined &&
      (!Number.isInteger(nightTimer) || nightTimer < 15 || nightTimer > 300)
    ) {
      return {
        valid: false,
        message: "Night timer must be between 15 and 300 seconds",
      };
    }

    if (
      discussionTimer !== undefined &&
      (!Number.isInteger(discussionTimer) ||
        discussionTimer < 30 ||
        discussionTimer > 600)
    ) {
      return {
        valid: false,
        message: "Discussion timer must be between 30 and 600 seconds",
      };
    }

    if (
      votingTimer !== undefined &&
      (!Number.isInteger(votingTimer) || votingTimer < 15 || votingTimer > 300)
    ) {
      return {
        valid: false,
        message: "Voting timer must be between 15 and 300 seconds",
      };
    }

    if (
      roleRevealTimer !== undefined &&
      (!Number.isInteger(roleRevealTimer) ||
        roleRevealTimer < 5 ||
        roleRevealTimer > 60)
    ) {
      return {
        valid: false,
        message: "Role reveal timer must be between 5 and 60 seconds",
      };
    }
  }

  return { valid: true };
}

/**
 * Validate socket data
 * @param {*} data - Data to validate
 * @param {string} expectedType - Expected data type
 * @returns {Object} Validation result
 */
function validateSocketData(data, expectedType) {
  if (data === null || data === undefined) {
    return {
      valid: false,
      message: "Data is required",
    };
  }

  if (expectedType === "object" && typeof data !== "object") {
    return {
      valid: false,
      message: "Expected object data",
    };
  }

  if (expectedType === "string" && typeof data !== "string") {
    return {
      valid: false,
      message: "Expected string data",
    };
  }

  if (expectedType === "number" && typeof data !== "number") {
    return {
      valid: false,
      message: "Expected number data",
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 500); // Limit length
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
  validateSocketData,
  sanitizeInput,
  validatePlayerAction,
};
