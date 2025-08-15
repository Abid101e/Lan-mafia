/**
 * Game Roles Configuration for LAN Mafia
 *
 * Defines all available roles, their abilities, and game behavior.
 * Used throughout the application for role assignment, UI display, and game logic.
 *
 * Role Types:
 * - KILLER: Mafia members who eliminate players at night
 * - HEALER: Protects players from elimination
 * - POLICE: Investigates players to determine their allegiance
 * - TOWNSPERSON: Regular citizens with no special abilities
 */
/**
 * Defines all game roles and their metadata.
 * Export:
 * - roleList: array of supported roles (killer, healer, police, civilian)
 * - roleDescriptions: map of role → abilities
 * - roleColors: role-specific UI colors
 */


export const ROLE_TYPES = {
  KILLER: "killer",
  HEALER: "healer",
  POLICE: "police",
  TOWNSPERSON: "townsperson",
};

export const ROLES = {
  [ROLE_TYPES.KILLER]: {
    name: "Killer",
    emoji: "🔪",
    description: "Eliminate other players during the night phase",
    team: "mafia",
    canAct: true,
    actionType: "kill",
    actionDescription: "Choose a player to eliminate",
    winCondition: "Eliminate all townspeople and outnumber or equal them",
  },

  [ROLE_TYPES.HEALER]: {
    name: "Healer",
    emoji: "💚",
    description: "Protect players from being eliminated",
    team: "town",
    canAct: true,
    actionType: "heal",
    actionDescription: "Choose a player to protect (cannot heal yourself)",
    winCondition: "Eliminate all killers",
  },

  [ROLE_TYPES.POLICE]: {
    name: "Police",
    emoji: "👮",
    description: "Investigate players to learn their role",
    team: "town",
    canAct: true,
    actionType: "investigate",
    actionDescription: "Choose a player to investigate",
    winCondition: "Eliminate all killers",
  },

  [ROLE_TYPES.TOWNSPERSON]: {
    name: "Townsperson",
    emoji: "👤",
    description: "Help identify and vote out the killers",
    team: "town",
    canAct: false,
    actionType: null,
    actionDescription: "Participate in discussions and voting",
    winCondition: "Eliminate all killers",
  },
};

// Game phase labels for UI display
export const GAME_PHASES = {
  LOBBY: "lobby",
  ROLE_REVEAL: "role_reveal",
  NIGHT: "night",
  DISCUSSION: "discussion",
  VOTING: "voting",
  RESULTS: "results",
  GAME_OVER: "game_over",
};

export const PHASE_LABELS = {
  [GAME_PHASES.LOBBY]: "Waiting for Players",
  [GAME_PHASES.ROLE_REVEAL]: "Role Assignment",
  [GAME_PHASES.NIGHT]: "Night Phase",
  [GAME_PHASES.DISCUSSION]: "Discussion Time",
  [GAME_PHASES.VOTING]: "Voting Phase",
  [GAME_PHASES.RESULTS]: "Round Results",
  [GAME_PHASES.GAME_OVER]: "Game Over",
};

// Team configurations for win condition checking
export const TEAMS = {
  MAFIA: "mafia",
  TOWN: "town",
};

// Default game configuration
export const DEFAULT_GAME_CONFIG = {
  totalPlayers: 8,
  roles: {
    [ROLE_TYPES.KILLER]: 2,
    [ROLE_TYPES.HEALER]: 1,
    [ROLE_TYPES.POLICE]: 1,
    [ROLE_TYPES.TOWNSPERSON]: 4,
  },
  timers: {
    nightPhase: 30,
    discussion: 120,
    voting: 60,
    roleReveal: 10,
  },
};

/**
 * Get role information by type
 * @param {string} roleType - Role type from ROLE_TYPES
 * @returns {object} Role configuration object
 */
export function getRoleInfo(roleType) {
  return ROLES[roleType] || ROLES[ROLE_TYPES.TOWNSPERSON];
}

/**
 * Get all roles for a specific team
 * @param {string} team - Team name ('mafia' or 'town')
 * @returns {array} Array of role types
 */
export function getRolesByTeam(team) {
  return Object.keys(ROLES).filter((roleType) => ROLES[roleType].team === team);
}

/**
 * Check if a role can perform night actions
 * @param {string} roleType - Role type from ROLE_TYPES
 * @returns {boolean} True if role can act at night
 */
export function canRoleAct(roleType) {
  const role = getRoleInfo(roleType);
  return role.canAct;
}
