class GameState {
  constructor() {
    // Initialize lookup caches for performance
    this._playerSocketMap = new Map();
    this._playerIdMap = new Map();
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
    this.discussionReadyPlayers = []; // Track which players are ready for voting

    // Clear lookup caches
    this._playerSocketMap.clear();
    this._playerIdMap.clear();
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

    // Update lookup caches
    this._playerSocketMap.set(socketId, player);
    this._playerIdMap.set(player.id, player);

    if (isHost) {
      this.hostId = socketId;
    }

    return player;
  }

  removePlayer(socketId) {
    const player = this._playerSocketMap.get(socketId);
    if (player) {
      const playerIndex = this.players.findIndex(
        (p) => p.socketId === socketId
      );
      if (playerIndex !== -1) {
        this.players.splice(playerIndex, 1);
      }

      // Remove from caches
      this._playerSocketMap.delete(socketId);
      this._playerIdMap.delete(player.id);

      // Clean up ready status
      this.readyPlayers = this.readyPlayers.filter((id) => id !== player.id);

      return player;
    }
    return null;
  }

  getPlayerBySocketId(socketId) {
    return this._playerSocketMap.get(socketId) || null;
  }

  getPlayerById(playerId) {
    return this._playerIdMap.get(playerId) || null;
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
    }
  }

  killPlayer(playerId) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.isAlive = false;
    }
  }

  // Host management
  setHost(socketId, name) {
    this.hostId = socketId;
  }

  isHost(socketId) {
    return this.hostId === socketId;
  }

  getHost() {
    return this.getPlayerBySocketId(this.hostId);
  }

  getHostName() {
    const host = this.getHost();
    return host ? host.name : "Unknown Host";
  }

  // Ready status management
  setPlayerReady(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    if (player && !player.isHost) {
      player.isReady = true;
      if (!this.readyPlayers.includes(player.id)) {
        this.readyPlayers.push(player.id);
      }
    }
  }

  setPlayerNotReady(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    if (player && !player.isHost) {
      player.isReady = false;
      this.readyPlayers = this.readyPlayers.filter((id) => id !== player.id);
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
  }

  getGameCode() {
    return this.gameCode;
  }

  // Game phase management
  setPhase(phase) {
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
  }

  getRoleAssignments() {
    return [...this.roleAssignments];
  }

  // Night actions management
  addNightAction(action) {
    // Remove existing action from same player efficiently
    const existingIndex = this.nightActions.findIndex(
      (a) => a.playerId === action.playerId
    );
    if (existingIndex !== -1) {
      this.nightActions.splice(existingIndex, 1);
    }

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
  }

  // Voting management
  addVote(playerId, targetId) {
    // Remove existing vote from same player efficiently
    const existingIndex = this.votes.findIndex((v) => v.playerId === playerId);
    if (existingIndex !== -1) {
      this.votes.splice(existingIndex, 1);
    }

    this.votes.push({
      playerId,
      targetId,
      timestamp: new Date(),
    });
  }

  getVotes() {
    return [...this.votes];
  }

  clearVotes() {
    this.votes = [];
  }

  // Round management
  nextRound() {
    this.roundNumber++;
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
