/**
 * Game Settings Management for LAN Mafia
 *
 * Handles host-configurable game settings including role counts,
 * timers, and game rules.
 */ /**
 * Stores the host's selected game settings (number of roles).
 * - getSettings(): returns current game configuration
 * - setSettings(settings): updates configuration from host input
 * Used by gameLogic.js to determine how many roles to assign.
 */

const config = require("./config");

class GameSettings {
  constructor() {
    this._defaultSettings = null; // Cache for default settings
    this.currentSettings = this.getDefaultSettings();
  }

  /**
   * Get default game settings (cached)
   */
  getDefaultSettings() {
    if (this._defaultSettings) {
      return { ...this._defaultSettings }; // Return copy of cached settings
    }

    // Create default settings once and cache them
    const configDefaults = config.get
      ? {
          totalPlayers: config.get("game.maxPlayers") || 8,
          timers: config.get("game.defaultTimers") || {
            nightTimer: 30,
            discussionTimer: 120,
            votingTimer: 60,
            roleRevealTimer: 10,
          },
          rules: config.get("game.defaultRules") || {
            allowSelfHeal: false,
            revealRoleOnDeath: true,
            allowSpectatorChat: false,
            randomizeRoleOrder: true,
          },
        }
      : {};

    this._defaultSettings = {
      totalPlayers: configDefaults.totalPlayers || 8,
      roles: {
        killers: 2,
        healers: 1,
        police: 1,
        townspeople: 4,
      },
      timers: configDefaults.timers || {
        nightTimer: 30,
        discussionTimer: 120,
        votingTimer: 60,
        roleRevealTimer: 10,
      },
      rules: configDefaults.rules || {
        allowSelfHeal: false,
        revealRoleOnDeath: true,
        allowSpectatorChat: false,
        randomizeRoleOrder: true,
      },
    };

    return { ...this._defaultSettings }; // Return copy
  }

  /**
   * Update game settings (called by host)
   * @param {Object} newSettings - New settings to apply
   */
  updateSettings(newSettings) {
    // Validate settings before applying
    const validatedSettings = this.validateSettings(newSettings);

    // Merge with current settings
    this.currentSettings = {
      ...this.currentSettings,
      ...validatedSettings,
    };

    return this.currentSettings;
  }

  /**
   * Validate game settings
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validated settings
   */
  validateSettings(settings) {
    const validated = { ...settings };

    // Validate player counts
    if (settings.totalPlayers) {
      validated.totalPlayers = Math.max(4, Math.min(20, settings.totalPlayers));
    }

    if (settings.roles) {
      const roles = settings.roles;

      // Ensure minimum viable game
      validated.roles = {
        killers: Math.max(1, Math.min(5, roles.killers || 1)),
        healers: Math.max(0, Math.min(3, roles.healers || 0)),
        police: Math.max(0, Math.min(2, roles.police || 0)),
        townspeople: Math.max(1, roles.townspeople || 1),
      };

      // Ensure role counts match total players
      const totalRoles = Object.values(validated.roles).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalRoles !== validated.totalPlayers) {
        // Adjust townspeople to match total
        validated.roles.townspeople =
          validated.totalPlayers -
          (validated.roles.killers +
            validated.roles.healers +
            validated.roles.police);
        validated.roles.townspeople = Math.max(1, validated.roles.townspeople);
      }

      // Ensure killers don't outnumber townspeople initially
      const townTotal =
        validated.roles.healers +
        validated.roles.police +
        validated.roles.townspeople;
      if (validated.roles.killers >= townTotal) {
        validated.roles.killers = Math.max(1, townTotal - 1);
        validated.roles.townspeople =
          validated.totalPlayers -
          (validated.roles.killers +
            validated.roles.healers +
            validated.roles.police);
      }
    }

    // Validate timers
    if (settings.timers) {
      validated.timers = {
        nightTimer: Math.max(
          15,
          Math.min(300, settings.timers.nightTimer || 30)
        ),
        discussionTimer: Math.max(
          30,
          Math.min(600, settings.timers.discussionTimer || 120)
        ),
        votingTimer: Math.max(
          15,
          Math.min(300, settings.timers.votingTimer || 60)
        ),
        roleRevealTimer: Math.max(
          5,
          Math.min(60, settings.timers.roleRevealTimer || 10)
        ),
      };
    }

    // Validate rules (boolean values)
    if (settings.rules) {
      validated.rules = {
        allowSelfHeal: Boolean(settings.rules.allowSelfHeal),
        revealRoleOnDeath: Boolean(settings.rules.revealRoleOnDeath),
        allowSpectatorChat: Boolean(settings.rules.allowSpectatorChat),
        randomizeRoleOrder: Boolean(settings.rules.randomizeRoleOrder),
      };
    }

    return validated;
  }

  /**
   * Get current settings
   */
  getCurrentSettings() {
    return { ...this.currentSettings };
  }

  /**
   * Reset to default settings
   */
  resetToDefaults() {
    this.currentSettings = this.getDefaultSettings();
    return this.currentSettings;
  }

  /**
   * Get specific setting value
   * @param {string} path - Dot notation path to setting (e.g., 'timers.nightTimer')
   */
  getSetting(path) {
    const keys = path.split(".");
    let value = this.currentSettings;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check if current settings are valid for starting a game
   */
  areSettingsValid() {
    const settings = this.currentSettings;

    // Check total players
    if (settings.totalPlayers < 4 || settings.totalPlayers > 20) {
      return { valid: false, reason: "Invalid total player count" };
    }

    // Check role distribution
    const totalRoles = Object.values(settings.roles).reduce(
      (sum, count) => sum + count,
      0
    );
    if (totalRoles !== settings.totalPlayers) {
      return { valid: false, reason: "Role counts do not match total players" };
    }

    // Check minimum killers
    if (settings.roles.killers < 1) {
      return { valid: false, reason: "Must have at least one killer" };
    }

    // Check killer balance
    const townTotal =
      settings.roles.healers +
      settings.roles.police +
      settings.roles.townspeople;
    if (settings.roles.killers >= townTotal) {
      return { valid: false, reason: "Too many killers for balanced gameplay" };
    }

    // Check timer values
    const timers = settings.timers;
    if (
      timers.nightTimer < 15 ||
      timers.discussionTimer < 30 ||
      timers.votingTimer < 15
    ) {
      return { valid: false, reason: "Timer values too low" };
    }

    return { valid: true };
  }

  /**
   * Get settings summary for display
   */
  getSettingsSummary() {
    const settings = this.currentSettings;

    return {
      playerCount: settings.totalPlayers,
      roleDistribution: `${settings.roles.killers}K, ${settings.roles.healers}H, ${settings.roles.police}P, ${settings.roles.townspeople}T`,
      timers: `Night: ${settings.timers.nightTimer}s, Discussion: ${settings.timers.discussionTimer}s, Vote: ${settings.timers.votingTimer}s`,
      specialRules:
        Object.entries(settings.rules)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(", ") || "None",
    };
  }
}

// Export singleton instance
const gameSettings = new GameSettings();
module.exports = gameSettings;
