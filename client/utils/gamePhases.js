/**
 * Game Phases Utility for LAN Mafia
 *
 * Manages game phase transitions, timing, and state.
 * Provides phase definitions and transition logic.
 */
/**
 * Enum-style list of game phases.
 * Exports:
 * - PHASES: 'lobby', 'role-reveal', 'night', 'day', 'voting', 'result', 'win'
 * - phaseLabels: human-readable names
 * - getNextPhase(): transition logic for phases
 */

// Game phase constants
export const GAME_PHASES = {
  LOBBY: "lobby",
  NIGHT: "night",
  DAY: "day",
  VOTING: "voting",
  TRIAL: "trial",
  EXECUTION: "execution",
  GAME_OVER: "game_over",
};

// Phase durations in seconds
export const PHASE_DURATIONS = {
  [GAME_PHASES.NIGHT]: 45,
  [GAME_PHASES.DAY]: 120,
  [GAME_PHASES.VOTING]: 60,
  [GAME_PHASES.TRIAL]: 30,
  [GAME_PHASES.EXECUTION]: 10,
};

// Phase descriptions for UI
export const PHASE_DESCRIPTIONS = {
  [GAME_PHASES.LOBBY]: "Waiting for players...",
  [GAME_PHASES.NIGHT]: "Mafia members wake up and choose a target",
  [GAME_PHASES.DAY]: "Discuss and find the mafia among you",
  [GAME_PHASES.VOTING]: "Vote to eliminate a suspicious player",
  [GAME_PHASES.TRIAL]: "Final defense before execution",
  [GAME_PHASES.EXECUTION]: "The town has decided...",
  [GAME_PHASES.GAME_OVER]: "Game finished",
};

// Phase flow order
export const PHASE_ORDER = [
  GAME_PHASES.LOBBY,
  GAME_PHASES.NIGHT,
  GAME_PHASES.DAY,
  GAME_PHASES.VOTING,
  GAME_PHASES.TRIAL,
  GAME_PHASES.EXECUTION,
  // GAME_OVER can happen from any phase
];

/**
 * Game Phase Manager Class
 */
export class GamePhaseManager {
  constructor() {
    this.currentPhase = GAME_PHASES.LOBBY;
    this.phaseStartTime = null;
    this.phaseTimer = null;
    this.onPhaseChange = null;
    this.onTimeUpdate = null;
    this.gameSettings = {};
  }

  /**
   * Initialize the phase manager with settings
   */
  initialize(settings = {}, onPhaseChange = null, onTimeUpdate = null) {
    this.gameSettings = {
      nightDuration:
        settings.nightDuration || PHASE_DURATIONS[GAME_PHASES.NIGHT],
      dayDuration: settings.dayDuration || PHASE_DURATIONS[GAME_PHASES.DAY],
      votingDuration:
        settings.votingDuration || PHASE_DURATIONS[GAME_PHASES.VOTING],
      trialDuration:
        settings.trialDuration || PHASE_DURATIONS[GAME_PHASES.TRIAL],
      executionDuration:
        settings.executionDuration || PHASE_DURATIONS[GAME_PHASES.EXECUTION],
    };

    this.onPhaseChange = onPhaseChange;
    this.onTimeUpdate = onTimeUpdate;
  }

  /**
   * Start a new phase
   */
  startPhase(phase, duration = null) {
    this.currentPhase = phase;
    this.phaseStartTime = Date.now();

    // Clear existing timer
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer);
    }

    // Set phase duration
    const phaseDuration = duration || this.getPhaseDuration(phase);

    if (phaseDuration > 0) {
      this.startPhaseTimer(phaseDuration);
    }

    // Notify phase change
    if (this.onPhaseChange) {
      this.onPhaseChange(phase, phaseDuration);
    }

    console.log(`Phase started: ${phase} (${phaseDuration}s)`);
  }

  /**
   * Start the phase timer
   */
  startPhaseTimer(duration) {
    let timeLeft = duration;

    this.phaseTimer = setInterval(() => {
      timeLeft--;

      if (this.onTimeUpdate) {
        this.onTimeUpdate(timeLeft);
      }

      if (timeLeft <= 0) {
        this.endPhase();
      }
    }, 1000);
  }

  /**
   * End current phase and transition to next
   */
  endPhase() {
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer);
      this.phaseTimer = null;
    }

    const nextPhase = this.getNextPhase();
    if (nextPhase) {
      this.startPhase(nextPhase);
    }
  }

  /**
   * Get the next phase in sequence
   */
  getNextPhase() {
    const currentIndex = PHASE_ORDER.indexOf(this.currentPhase);

    // Special cases
    if (this.currentPhase === GAME_PHASES.LOBBY) {
      return GAME_PHASES.NIGHT;
    }

    if (this.currentPhase === GAME_PHASES.EXECUTION) {
      // Check if game should end or continue to night
      return GAME_PHASES.NIGHT; // Let game logic decide if game ends
    }

    // Standard progression
    if (currentIndex >= 0 && currentIndex < PHASE_ORDER.length - 1) {
      return PHASE_ORDER[currentIndex + 1];
    }

    return null;
  }

  /**
   * Get duration for a specific phase
   */
  getPhaseDuration(phase) {
    switch (phase) {
      case GAME_PHASES.NIGHT:
        return this.gameSettings.nightDuration;
      case GAME_PHASES.DAY:
        return this.gameSettings.dayDuration;
      case GAME_PHASES.VOTING:
        return this.gameSettings.votingDuration;
      case GAME_PHASES.TRIAL:
        return this.gameSettings.trialDuration;
      case GAME_PHASES.EXECUTION:
        return this.gameSettings.executionDuration;
      default:
        return 0; // No timer for lobby and game over
    }
  }

  /**
   * Get current phase information
   */
  getCurrentPhaseInfo() {
    return {
      phase: this.currentPhase,
      description: PHASE_DESCRIPTIONS[this.currentPhase],
      duration: this.getPhaseDuration(this.currentPhase),
      startTime: this.phaseStartTime,
    };
  }

  /**
   * Force transition to specific phase
   */
  forcePhase(phase, duration = null) {
    this.startPhase(phase, duration);
  }

  /**
   * Skip current phase
   */
  skipPhase() {
    this.endPhase();
  }

  /**
   * Pause the current phase timer
   */
  pauseTimer() {
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  /**
   * Resume the phase timer
   */
  resumeTimer(timeLeft) {
    if (timeLeft > 0) {
      this.startPhaseTimer(timeLeft);
    }
  }

  /**
   * Stop the phase manager
   */
  stop() {
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer);
      this.phaseTimer = null;
    }
    this.currentPhase = GAME_PHASES.LOBBY;
    this.phaseStartTime = null;
  }

  /**
   * Check if current phase has a timer
   */
  hasTimer() {
    return this.getPhaseDuration(this.currentPhase) > 0;
  }

  /**
   * Get time elapsed in current phase
   */
  getElapsedTime() {
    if (!this.phaseStartTime) return 0;
    return Math.floor((Date.now() - this.phaseStartTime) / 1000);
  }

  /**
   * Get time remaining in current phase
   */
  getTimeRemaining() {
    const duration = this.getPhaseDuration(this.currentPhase);
    const elapsed = this.getElapsedTime();
    return Math.max(0, duration - elapsed);
  }
}

// Export utility functions
export const getPhaseColor = (phase) => {
  switch (phase) {
    case GAME_PHASES.NIGHT:
      return "#1a1a3a";
    case GAME_PHASES.DAY:
      return "#3a3a1a";
    case GAME_PHASES.VOTING:
      return "#3a1a1a";
    case GAME_PHASES.TRIAL:
      return "#3a1a3a";
    case GAME_PHASES.EXECUTION:
      return "#1a1a1a";
    case GAME_PHASES.GAME_OVER:
      return "#2a2a2a";
    default:
      return "#1a2a1a";
  }
};

export const getPhaseIcon = (phase) => {
  switch (phase) {
    case GAME_PHASES.LOBBY:
      return "👥";
    case GAME_PHASES.NIGHT:
      return "🌙";
    case GAME_PHASES.DAY:
      return "☀️";
    case GAME_PHASES.VOTING:
      return "🗳️";
    case GAME_PHASES.TRIAL:
      return "⚖️";
    case GAME_PHASES.EXECUTION:
      return "💀";
    case GAME_PHASES.GAME_OVER:
      return "🏁";
    default:
      return "❓";
  }
};

// Create singleton instance
export const gamePhaseManager = new GamePhaseManager();

export default gamePhaseManager;
