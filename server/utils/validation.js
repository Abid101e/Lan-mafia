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
  console.log("🔍 Starting validation...");
  console.log("📥 Received settings:", JSON.stringify(settings, null, 2));
  console.log("📊 Settings type:", typeof settings);
  console.log("📋 Settings keys:", Object.keys(settings || {}));

  if (!settings || typeof settings !== "object") {
    console.log("❌ Settings validation failed: not an object");
    return {
      valid: false,
      message: "Invalid settings format",
    };
  }

  // Handle both flat and nested formats
  let roles, timers, totalPlayers;

  if (settings.roles) {
    console.log("🎭 Using nested format");
    // Nested format
    roles = settings.roles;
    timers = settings.timers || {};
    totalPlayers = settings.totalPlayers;
  } else {
    console.log("📄 Using flat format (legacy)");
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

  console.log("🎭 Extracted roles:", JSON.stringify(roles, null, 2));
  console.log("⏱️ Extracted timers:", JSON.stringify(timers, null, 2));
  console.log("👥 Total players:", totalPlayers);

  // Check if roles object exists and has properties
  if (!roles || typeof roles !== "object") {
    console.log("❌ Roles validation failed: roles not found or not an object");
    return {
      valid: false,
      message: "Invalid settings format - roles missing",
    };
  }

  // Validate total players (allowing 3 for testing)
  if (totalPlayers !== undefined) {
    console.log("🔢 Validating total players:", totalPlayers);
    if (
      !Number.isInteger(totalPlayers) ||
      totalPlayers < 3 || // Changed from 4 to 3 for testing
      totalPlayers > 20
    ) {
      console.log("❌ Total players validation failed");
      return {
        valid: false,
        message: "Total players must be between 3 and 20 (testing mode)",
      };
    }
  }

  // Validate roles
  const { killers, healers, police, townspeople } = roles;
  console.log(
    "🔍 Individual roles - killers:",
    killers,
    "healers:",
    healers,
    "police:",
    police,
    "townspeople:",
    townspeople
  );

  if (
    killers !== undefined &&
    (!Number.isInteger(killers) || killers < 1 || killers > 5)
  ) {
    console.log("❌ Killers validation failed:", killers);
    return {
      valid: false,
      message: "Killers must be between 1 and 5",
    };
  }

  if (
    healers !== undefined &&
    (!Number.isInteger(healers) || healers < 0 || healers > 3)
  ) {
    console.log("❌ Healers validation failed:", healers);
    return {
      valid: false,
      message: "Healers must be between 0 and 3",
    };
  }

  if (
    police !== undefined &&
    (!Number.isInteger(police) || police < 0 || police > 2)
  ) {
    console.log("❌ Police validation failed:", police);
    return {
      valid: false,
      message: "Police must be between 0 and 2",
    };
  }

  if (
    townspeople !== undefined &&
    (!Number.isInteger(townspeople) || townspeople < 0)
  ) {
    console.log("❌ Townspeople validation failed:", townspeople);
    return {
      valid: false,
      message: "Townspeople count must be 0 or greater (testing mode allows 0)",
    };
  }

  // Special case for 3-player testing: allow 0 townspeople
  if (totalPlayers === 3 && townspeople === 0) {
    console.log("⚠️ 3-player testing mode: allowing 0 townspeople");
  } else if (townspeople !== undefined && townspeople < 1) {
    console.log(
      "❌ Townspeople validation failed for normal game:",
      townspeople
    );
    return {
      valid: false,
      message:
        "Must have at least 1 townsperson (except in 3-player testing mode)",
    };
  }

  console.log("✅ Roles validation passed");

  // Validate timers if they exist
  if (timers && typeof timers === "object") {
    console.log("⏱️ Validating timers...");
    const { nightTimer, discussionTimer, votingTimer, roleRevealTimer } =
      timers;

    if (
      nightTimer !== undefined &&
      (!Number.isInteger(nightTimer) || nightTimer < 15 || nightTimer > 300)
    ) {
      console.log("❌ Night timer validation failed:", nightTimer);
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
      console.log("❌ Discussion timer validation failed:", discussionTimer);
      return {
        valid: false,
        message: "Discussion timer must be between 30 and 600 seconds",
      };
    }

    if (
      votingTimer !== undefined &&
      (!Number.isInteger(votingTimer) || votingTimer < 15 || votingTimer > 300)
    ) {
      console.log("❌ Voting timer validation failed:", votingTimer);
      return {
        valid: false,
        message: "Voting timer must be between 15 and 300 seconds",
      };
    }

    console.log("✅ Timers validation passed");
  }

  console.log("✅ All validation passed successfully!");
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
