/**
 * Role Builder Utility for LAN Mafia
 *
 * Creates role lists based on game settings and ensures proper distribution
 * for balanced gameplay.
 */
/**
 * Builds an array of roles based on selected settings.
 * Input: { killer: 2, healer: 1, police: 1 }
 * Output: ['killer', 'killer', 'healer', 'police', 'civilian', 'civilian', ...]
 * Ensures the correct total player count and role mix.
 */

const { shuffle } = require("./shuffle");

/**
 * Build role list from game settings
 * @param {Object} settings - Game configuration with role counts
 * @returns {Array} Array of role strings for assignment
 */
function buildRoleList(settings) {
  console.log("🎭 Building role list from settings:", settings);

  const roles = [];

  // Add killers
  for (let i = 0; i < (settings.killers || settings.roles?.killers || 2); i++) {
    roles.push("killer");
  }

  // Add healers
  for (let i = 0; i < (settings.healers || settings.roles?.healers || 1); i++) {
    roles.push("healer");
  }

  // Add police
  for (let i = 0; i < (settings.police || settings.roles?.police || 1); i++) {
    roles.push("police");
  }

  // Add townspeople
  const townspeopleCount =
    settings.townspeople ||
    settings.roles?.townspeople ||
    settings.totalPlayers - roles.length;

  for (let i = 0; i < townspeopleCount; i++) {
    roles.push("townsperson");
  }

  console.log("✅ Role list built:", roles);
  return roles;
}

/**
 * Validate role distribution
 * @param {Object} settings - Game settings to validate
 * @returns {Object} Validation result with success flag and message
 */
function validateRoleDistribution(settings) {
  const totalPlayers = settings.totalPlayers || 8;
  const killers = settings.killers || settings.roles?.killers || 2;
  const healers = settings.healers || settings.roles?.healers || 1;
  const police = settings.police || settings.roles?.police || 1;
  const townspeople = settings.townspeople || settings.roles?.townspeople || 4;

  const totalRoles = killers + healers + police + townspeople;

  // Check total count matches
  if (totalRoles !== totalPlayers) {
    return {
      valid: false,
      message: `Role count (${totalRoles}) doesn't match total players (${totalPlayers})`,
    };
  }

  // Check minimum requirements
  if (killers < 1) {
    return {
      valid: false,
      message: "Must have at least 1 killer",
    };
  }

  if (townspeople < 1) {
    return {
      valid: false,
      message: "Must have at least 1 townsperson",
    };
  }

  // Check balance (killers shouldn't outnumber townspeople)
  const townTotal = healers + police + townspeople;
  if (killers >= townTotal) {
    return {
      valid: false,
      message: "Too many killers - game would be unbalanced",
    };
  }

  // Check maximum limits
  if (killers > 5) {
    return {
      valid: false,
      message: "Too many killers (maximum 5)",
    };
  }

  if (healers > 3) {
    return {
      valid: false,
      message: "Too many healers (maximum 3)",
    };
  }

  if (police > 2) {
    return {
      valid: false,
      message: "Too many police (maximum 2)",
    };
  }

  return {
    valid: true,
    message: "Role distribution is valid",
  };
}

/**
 * Get recommended role distribution for player count
 * @param {number} playerCount - Number of players in game
 * @returns {Object} Recommended role counts
 */
function getRecommendedRoles(playerCount) {
  // Recommended distributions for different player counts
  const recommendations = {
    4: { killers: 1, healers: 1, police: 0, townspeople: 2 },
    5: { killers: 1, healers: 1, police: 1, townspeople: 2 },
    6: { killers: 2, healers: 1, police: 1, townspeople: 2 },
    7: { killers: 2, healers: 1, police: 1, townspeople: 3 },
    8: { killers: 2, healers: 1, police: 1, townspeople: 4 },
    9: { killers: 2, healers: 1, police: 1, townspeople: 5 },
    10: { killers: 3, healers: 1, police: 1, townspeople: 5 },
    11: { killers: 3, healers: 1, police: 1, townspeople: 6 },
    12: { killers: 3, healers: 2, police: 1, townspeople: 6 },
    13: { killers: 3, healers: 2, police: 1, townspeople: 7 },
    14: { killers: 4, healers: 2, police: 1, townspeople: 7 },
    15: { killers: 4, healers: 2, police: 1, townspeople: 8 },
    16: { killers: 4, healers: 2, police: 2, townspeople: 8 },
    17: { killers: 4, healers: 2, police: 2, townspeople: 9 },
    18: { killers: 5, healers: 2, police: 2, townspeople: 9 },
    19: { killers: 5, healers: 2, police: 2, townspeople: 10 },
    20: { killers: 5, healers: 3, police: 2, townspeople: 10 },
  };

  // Return exact match or closest recommendation
  if (recommendations[playerCount]) {
    return recommendations[playerCount];
  }

  // For player counts not in table, calculate based on ratios
  const killerRatio = 0.25; // ~25% killers
  const healerRatio = 0.12; // ~12% healers
  const policeRatio = 0.1; // ~10% police

  const killers = Math.max(
    1,
    Math.min(5, Math.round(playerCount * killerRatio))
  );
  const healers = Math.max(
    1,
    Math.min(3, Math.round(playerCount * healerRatio))
  );
  const police = Math.max(
    0,
    Math.min(2, Math.round(playerCount * policeRatio))
  );
  const townspeople = playerCount - killers - healers - police;

  return { killers, healers, police, townspeople };
}

/**
 * Auto-balance role distribution
 * @param {Object} settings - Current settings
 * @returns {Object} Balanced role distribution
 */
function autoBalanceRoles(settings) {
  const playerCount = settings.totalPlayers || 8;
  const recommended = getRecommendedRoles(playerCount);

  console.log(
    `🎭 Auto-balancing roles for ${playerCount} players:`,
    recommended
  );

  return {
    ...settings,
    killers: recommended.killers,
    healers: recommended.healers,
    police: recommended.police,
    townspeople: recommended.townspeople,
  };
}

/**
 * Get role distribution summary
 * @param {Object} settings - Role settings
 * @returns {string} Human-readable summary
 */
function getRoleDistributionSummary(settings) {
  const killers = settings.killers || settings.roles?.killers || 0;
  const healers = settings.healers || settings.roles?.healers || 0;
  const police = settings.police || settings.roles?.police || 0;
  const townspeople = settings.townspeople || settings.roles?.townspeople || 0;

  const parts = [];
  if (killers > 0) parts.push(`${killers} Killer${killers > 1 ? "s" : ""}`);
  if (healers > 0) parts.push(`${healers} Healer${healers > 1 ? "s" : ""}`);
  if (police > 0) parts.push(`${police} Police`);
  if (townspeople > 0) parts.push(`${townspeople} Townspeople`);

  return parts.join(", ");
}

module.exports = {
  buildRoleList,
  validateRoleDistribution,
  getRecommendedRoles,
  autoBalanceRoles,
  getRoleDistributionSummary,
};
