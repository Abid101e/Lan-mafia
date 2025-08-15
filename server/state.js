/**
 * Game State Management for LAN Mafia
 *
 * Centralized state management for all game data including players,
 * game phase, actions, votes, and settings.
 */
/**
 * Stores and manages in-memory game state for LAN Mafia.
 * Includes:
 * - connected players
 * - player roles
 * - alive/dead status
 * - current game phase
 * - action/vote history
 * Should expose getter and setter functions to update state from other modules.
 */

class GameState {
  constructor() {
    this.reset();
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.players = [];
    this.hostId = null;
    this.gameCode = null;
    this.currentPhase = "lobby";
    this.gameActive = false;
    this.nightActions = [];
    this.votes = [];
    this.roleAssignments = [];
    this.roundNumber = 0;
    this.readyPlayers = []; // Track which players are ready
  }

  // Player management
  addPlayer(socketId, name, isHost = false) {
    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      socketId,
      name,
      isHost,
      isAlive: true,
      isConnected: true,
      isReady: false, // Add ready status
      role: null,
      joinedAt: new Date(),
    };

    this.players.push(player);

    if (isHost) {
      this.hostId = socketId;
    }

    console.log(`➕ Added player: ${name} (${player.id})`);
    return player;
  }

  removePlayer(socketId) {
    const playerIndex = this.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex !== -1) {
      const player = this.players[playerIndex];
      this.players.splice(playerIndex, 1);

      // Clean up ready status
      this.readyPlayers = this.readyPlayers.filter((id) => id !== player.id);

      console.log(`➖ Removed player: ${player.name}`);
      return player;
    }
    return null;
  }

  getPlayerBySocketId(socketId) {
    return this.players.find((p) => p.socketId === socketId);
  }

  getPlayerById(playerId) {
    return this.players.find((p) => p.id === playerId);
  }

  getPlayers() {
    return [...this.players];
  }

  getAlivePlayers() {
    return this.players.filter((p) => p.isAlive);
  }

  getPlayerCount() {
    return this.players.length;
  }

  markPlayerDisconnected(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    if (player) {
      player.isConnected = false;
      console.log(`🔌 Marked ${player.name} as disconnected`);
    }
  }

  killPlayer(playerId) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.isAlive = false;
      console.log(`💀 ${player.name} was eliminated`);
    }
  }

  // Host management
  setHost(socketId, name) {
    this.hostId = socketId;
    console.log(`👑 ${name} is now the host`);
  }

  isHost(socketId) {
    return this.hostId === socketId;
  }

  getHost() {
    return this.players.find((p) => p.socketId === this.hostId);
  }

  // Ready status management
  setPlayerReady(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    if (player && !player.isHost) {
      player.isReady = true;
      if (!this.readyPlayers.includes(player.id)) {
        this.readyPlayers.push(player.id);
      }
      console.log(`✅ Player ${player.name} is ready`);
    }
  }

  setPlayerNotReady(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    if (player && !player.isHost) {
      player.isReady = false;
      this.readyPlayers = this.readyPlayers.filter((id) => id !== player.id);
      console.log(`⏳ Player ${player.name} is not ready`);
    }
  }

  getReadyPlayers() {
    return [...this.readyPlayers];
  }

  areAllPlayersReady() {
    const nonHostPlayers = this.players.filter((p) => !p.isHost);
    return nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
  }

  // Game code management
  setGameCode(code) {
    this.gameCode = code;
    console.log(`🎯 Game code set: ${code}`);
  }

  getGameCode() {
    return this.gameCode;
  }

  // Game phase management
  setPhase(phase) {
    console.log(`🎮 Game phase changed: ${this.currentPhase} → ${phase}`);
    this.currentPhase = phase;

    if (phase === "night" || phase === "discussion" || phase === "voting") {
      this.gameActive = true;
    } else if (phase === "game_over") {
      this.gameActive = false;
    }
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  isGameActive() {
    return this.gameActive;
  }

  canJoinGame() {
    return this.currentPhase === "lobby" && this.players.length < 20;
  }

  // Role management
  setRoleAssignments(assignments) {
    this.roleAssignments = assignments;

    // Update player objects with roles
    assignments.forEach((assignment) => {
      const player = this.getPlayerById(assignment.playerId);
      if (player) {
        player.role = assignment.role;
      }
    });

    console.log("🎭 Role assignments set");
  }

  getRoleAssignments() {
    return [...this.roleAssignments];
  }

  // Night actions management
  addNightAction(action) {
    // Remove any existing action from this player
    this.nightActions = this.nightActions.filter(
      (a) => a.playerId !== action.playerId
    );

    // Add new action
    this.nightActions.push({
      ...action,
      timestamp: new Date(),
    });

    console.log(
      `🌙 Night action recorded: ${action.playerId} ${action.action} ${action.target}`
    );
  }

  getNightActions() {
    return [...this.nightActions];
  }

  clearNightActions() {
    this.nightActions = [];
    console.log("🌙 Night actions cleared");
  }

  // Voting management
  addVote(playerId, targetId) {
    // Remove any existing vote from this player
    this.votes = this.votes.filter((v) => v.playerId !== playerId);

    // Add new vote
    this.votes.push({
      playerId,
      targetId,
      timestamp: new Date(),
    });

    console.log(`🗳️ Vote recorded: ${playerId} → ${targetId}`);
  }

  getVotes() {
    return [...this.votes];
  }

  clearVotes() {
    this.votes = [];
    console.log("🗳️ Votes cleared");
  }

  // Round management
  nextRound() {
    this.roundNumber++;
    console.log(`🔄 Round ${this.roundNumber} started`);
  }

  getRoundNumber() {
    return this.roundNumber;
  }

  // Complete game state
  getGameState() {
    return {
      players: this.getPlayers(),
      phase: this.currentPhase,
      gameActive: this.gameActive,
      roundNumber: this.roundNumber,
      hostId: this.hostId,
    };
  }

  // Reset specific to new game (keeps players)
  resetGame() {
    console.log("🔄 Resetting game state");

    // Reset player states but keep connections
    this.players.forEach((player) => {
      player.isAlive = true;
      player.role = null;
    });

    this.currentPhase = "lobby";
    this.gameActive = false;
    this.nightActions = [];
    this.votes = [];
    this.roleAssignments = [];
    this.roundNumber = 0;
  }
}

// Export singleton instance
const gameState = new GameState();
module.exports = gameState;
