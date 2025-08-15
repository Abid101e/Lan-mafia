/**
 * Socket Event Handlers for LAN Mafia Game
 *
 * Manages all real-time WebSocket communication between clients and server.
 * Handles player connections, game events, and state synchronization.
 */
/**
 * Handles all Socket.IO event bindings for LAN Mafia.
 * - player connection and disconnection
 * - player join lobby
 * - host starts game
 * - client submits role actions
 * - voting and results
 * Emits:
 * - game updates
 * - role assignments
 * - phase transitions
 */

const gameLogic = require("./gameLogic");
const gameState = require("./state");
const settings = require("./settings");
const logger = require("./utils/logger");
const gameDiscovery = require("./utils/gameDiscovery");
const {
  validatePlayerName,
  validateGameSettings,
  validatePlayerAction,
} = require("./utils/validation");
const {
  handleSocketError,
  createValidationError,
  createPermissionError,
  createGameStateError,
  createPlayerError,
} = require("./utils/errorHandler");

/**
 * Setup all socket event handlers
 * @param {Server} io - Socket.io server instance
 */
function setupSocketEvents(io) {
  io.on("connection", (socket) => {
    logger.player(`Player connected: ${socket.id}`);

    // Send current game state to newly connected player
    socket.emit("gameStateUpdated", gameState.getGameState());

    // Player hosting a new game
    socket.on("hostGame", (data) => {
      try {
        const { playerName, maxPlayers = 8 } = data;

        // Validate player name
        const nameValidation = validatePlayerName(playerName);
        if (!nameValidation.valid) {
          throw createValidationError(nameValidation, "hostGame");
        }

        logger.game(`${nameValidation.sanitizedName} is hosting a new game`);

        // Initialize new game
        gameState.resetGame();
        gameState.setHost(socket.id, nameValidation.sanitizedName);

        // Add host as first player
        const player = gameState.addPlayer(
          socket.id,
          nameValidation.sanitizedName,
          true
        );

        // Generate unique game code
        const gameCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        gameState.setGameCode(gameCode);

        // Start network discovery broadcasting
        gameDiscovery.startHosting({
          gameCode: gameCode,
          hostName: nameValidation.sanitizedName,
          playerCount: 1,
          maxPlayers: maxPlayers,
          status: "waiting",
        });

        // Broadcast updated player list
        io.emit("playersUpdated", gameState.getPlayers());

        socket.emit("gameCreated", {
          gameCode: gameCode,
          hostId: player.id,
          isHost: true,
        });

        logger.game(`Game created with code: ${gameCode}`);
      } catch (error) {
        handleSocketError(socket, error, "hostGame");
      }
    });

    // Player joining an existing game
    socket.on("joinGame", (data) => {
      try {
        const { playerName } = data;

        // Validate player name
        const nameValidation = validatePlayerName(playerName);
        if (!nameValidation.valid) {
          throw createValidationError(nameValidation, "joinGame");
        }

        logger.game(`${nameValidation.sanitizedName} is joining the game`);

        // Check if game is joinable
        if (!gameState.canJoinGame()) {
          throw createGameStateError("Game is not accepting new players");
        }

        // Check for duplicate names
        const existingPlayers = gameState.getPlayers();
        if (
          existingPlayers.some(
            (p) =>
              p.name.toLowerCase() ===
              nameValidation.sanitizedName.toLowerCase()
          )
        ) {
          throw createValidationError(
            { message: "Player name already taken" },
            "joinGame"
          );
        }

        // Add player to game
        const player = gameState.addPlayer(
          socket.id,
          nameValidation.sanitizedName,
          false
        );

        // Send player their info
        socket.emit("playerJoined", {
          playerId: player.id,
          isHost: false,
        });

        // Broadcast updated player list to all clients
        io.emit("playersUpdated", gameState.getPlayers());
      } catch (error) {
        handleSocketError(socket, error, "joinGame");
      }
    });

    // Get current players list
    socket.on("getPlayers", (data) => {
      try {
        console.log("getPlayers request received:", data);
        const players = gameState.getPlayers();
        console.log("Sending players response:", players);
        console.log("Broadcasting to all clients...");
        io.emit("playersUpdated", players); // Broadcast to all clients instead of just this socket
      } catch (error) {
        handleSocketError(socket, error, "getPlayers");
      }
    });

    // Get current player's role
    socket.on("getCurrentRole", () => {
      try {
        console.log("getCurrentRole request received from socket:", socket.id);
        const player = gameState.getPlayerBySocketId(socket.id);
        if (player && player.role) {
          console.log(`Sending role ${player.role} to player ${player.name}`);
          socket.emit("roleAssigned", player.role);
        } else {
          console.log("Player not found or no role assigned yet");
        }
      } catch (error) {
        handleSocketError(socket, error, "getCurrentRole");
      }
    });

    // Update game settings (auto-save from host)
    socket.on("updateGameSettings", (data) => {
      try {
        if (!gameState.isHost(socket.id)) {
          throw createPermissionError(socket.id, "update game settings");
        }

        const { settings: newSettings } = data;
        console.log("Updating game settings:", newSettings);

        // Store settings for when game starts
        settings.updateSettings(newSettings);

        // Acknowledge the update
        socket.emit("settingsUpdated", {
          success: true,
          settings: newSettings,
        });

        console.log("Game settings updated successfully");
      } catch (error) {
        handleSocketError(socket, error, "updateGameSettings");
      }
    });

    // Host starting the game with settings
    socket.on("startGame", (gameSettings) => {
      try {
        if (!gameState.isHost(socket.id)) {
          throw createPermissionError(socket.id, "start the game");
        }

        console.log(
          "Received game settings:",
          JSON.stringify(gameSettings, null, 2)
        );

        // Validate game settings
        const settingsValidation = validateGameSettings(gameSettings);
        console.log("Settings validation result:", settingsValidation);

        if (!settingsValidation.valid) {
          console.log(
            "Settings validation failed:",
            settingsValidation.message
          );
          throw createValidationError(settingsValidation, "startGame");
        }

        logger.game("Game starting with settings:", gameSettings);

        // Apply game settings
        settings.updateSettings(gameSettings);

        // Assign roles to all players
        const roleAssignments = gameLogic.assignRoles(
          gameState.getPlayers(),
          gameSettings
        );
        gameState.setRoleAssignments(roleAssignments);

        // Update game phase
        gameState.setPhase("role_reveal");

        // Send role assignments to each player
        roleAssignments.forEach((assignment) => {
          const playerSocket = io.sockets.sockets.get(assignment.socketId);
          if (playerSocket) {
            playerSocket.emit("roleAssigned", assignment.role);
          }
        });

        // Broadcast game start
        io.emit("gameStarted", {
          phase: "role_reveal",
          settings: gameSettings,
        });

        // Start role reveal timer
        setTimeout(() => {
          startNightPhase(io);
        }, 10000); // 10 seconds for role reveal
      } catch (error) {
        handleSocketError(socket, error, "startGame");
      }
    });

    // Handle night phase actions (kill, heal, investigate)
    socket.on("nightAction", (data) => {
      try {
        const { action, target } = data;
        const player = gameState.getPlayerBySocketId(socket.id);

        if (!player) {
          throw createPlayerError("Player not found", socket.id);
        }

        if (!player.isAlive) {
          throw createPlayerError(
            "Dead players cannot perform actions",
            player.id
          );
        }

        // Validate action
        const actionValidation = validatePlayerAction(
          action,
          player.id,
          target
        );
        if (!actionValidation.valid) {
          throw createValidationError(actionValidation, "nightAction");
        }

        logger.game(`${player.name} performed ${action} on ${target}`);

        // Record the action
        gameState.addNightAction({
          playerId: player.id,
          action,
          target,
          role: player.role,
        });

        // Check if all night actions are complete
        if (
          gameLogic.areAllNightActionsComplete(
            gameState.getPlayers(),
            gameState.getNightActions()
          )
        ) {
          processNightPhase(io);
        }
      } catch (error) {
        handleSocketError(socket, error, "nightAction");
      }
    });

    // Handle voting
    socket.on("vote", (data) => {
      try {
        const { targetId } = data;
        const player = gameState.getPlayerBySocketId(socket.id);

        if (!player || !player.isAlive) {
          throw createPlayerError(
            "Cannot vote - player not found or dead",
            player?.id
          );
        }

        // Validate vote
        const voteValidation = validatePlayerAction(
          "vote",
          player.id,
          targetId
        );
        if (!voteValidation.valid) {
          throw createValidationError(voteValidation, "vote");
        }

        logger.game(`${player.name} voted for ${targetId}`);

        // Record the vote
        gameState.addVote(player.id, targetId);

        // Check if all votes are in
        if (
          gameLogic.areAllVotesComplete(
            gameState.getAlivePlayers(),
            gameState.getVotes()
          )
        ) {
          processVotingPhase(io);
        }
      } catch (error) {
        handleSocketError(socket, error, "vote");
      }
    });

    // Ready status management
    socket.on("setReadyStatus", (data) => {
      try {
        const { gameCode, isReady } = data;
        console.log(`Player ${socket.id} set ready status to:`, isReady);

        if (isReady) {
          gameState.setPlayerReady(socket.id);
        } else {
          gameState.setPlayerNotReady(socket.id);
        }

        // Broadcast updated ready status to all players
        const readyPlayers = gameState.getReadyPlayers();
        io.emit("readyStatusUpdated", { readyPlayers });

        console.log("Ready players:", readyPlayers);
      } catch (error) {
        handleSocketError(socket, error, "setReadyStatus");
      }
    });

    // Game discovery events
    socket.on("scanForGames", async () => {
      try {
        const games = await gameDiscovery.scanForGames(2000);
        socket.emit("gameListUpdated", games);
      } catch (error) {
        handleSocketError(socket, error, "scanForGames");
      }
    });

    // Get current players for a game
    socket.on("getPlayers", (data) => {
      try {
        console.log("getPlayers request received:", data);
        const players = gameState.getPlayers();
        console.log("Sending players response:", players);
        socket.emit("playersResponse", players);
      } catch (error) {
        handleSocketError(socket, error, "getPlayers");
      }
    });

    socket.on("joinGameByCode", (data) => {
      try {
        const { gameCode, playerName } = data;

        // Validate player name
        const nameValidation = validatePlayerName(playerName);
        if (!nameValidation.valid) {
          throw createValidationError(nameValidation, "joinGameByCode");
        }

        // Check if this server hosts the requested game
        const currentGameCode = gameState.getGameCode();
        if (currentGameCode !== gameCode) {
          throw createGameStateError("Game not found on this server");
        }

        // Check if game is joinable
        if (!gameState.canJoinGame()) {
          throw createGameStateError("Game is not accepting new players");
        }

        // Check for duplicate names
        const existingPlayers = gameState.getPlayers();
        if (
          existingPlayers.some(
            (p) =>
              p.name.toLowerCase() ===
              nameValidation.sanitizedName.toLowerCase()
          )
        ) {
          throw createValidationError(
            { message: "Player name already taken" },
            "joinGameByCode"
          );
        }

        // Add player to game
        const player = gameState.addPlayer(
          socket.id,
          nameValidation.sanitizedName,
          false
        );

        // Update discovery info
        gameDiscovery.updateGameInfo({
          playerCount: gameState.getPlayerCount(),
        });

        // Send success response
        socket.emit("joinedGame", {
          gameCode: currentGameCode,
          playerId: player.id,
          isHost: false,
        });

        // Broadcast updated player list
        io.emit("playersUpdated", gameState.getPlayers());

        logger.game(`${nameValidation.sanitizedName} joined game ${gameCode}`);
      } catch (error) {
        handleSocketError(socket, error, "joinGameByCode");
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.player(`Player disconnected: ${socket.id}`);

      const player = gameState.getPlayerBySocketId(socket.id);
      if (player) {
        logger.player(`${player.name} left the game`);

        // Mark player as disconnected but keep in game
        gameState.markPlayerDisconnected(socket.id);

        // If host disconnected, handle host transfer or game end
        if (gameState.isHost(socket.id)) {
          logger.game("Host disconnected - ending game");
          io.emit("hostDisconnected", { message: "Host left the game" });
          gameState.resetGame();
        } else {
          // Broadcast updated player list
          io.emit("playersUpdated", gameState.getPlayers());
        }
      }
    });
  });
}

/**
 * Start the night phase
 */
function startNightPhase(io) {
  logger.game("Starting night phase");

  gameState.setPhase("night");
  gameState.clearNightActions();

  io.emit("gamePhaseChanged", "night");

  // Start night phase timer
  const nightTimer = settings.getCurrentSettings().nightTimer;
  startPhaseTimer(io, nightTimer, () => {
    processNightPhase(io);
  });
}

/**
 * Process night phase results
 */
function processNightPhase(io) {
  logger.game("Processing night phase");

  const nightActions = gameState.getNightActions();
  const results = gameLogic.processNightActions(
    nightActions,
    gameState.getPlayers()
  );

  // Apply results to game state
  results.deaths.forEach((playerId) => {
    gameState.killPlayer(playerId);
  });

  // Check win condition
  const winCheck = gameLogic.checkWinCondition(gameState.getPlayers());
  if (winCheck.gameOver) {
    endGame(io, winCheck);
    return;
  }

  // Move to discussion phase
  gameState.setPhase("discussion");

  io.emit("nightResults", results);
  io.emit("gamePhaseChanged", "discussion");
  io.emit("playersUpdated", gameState.getPlayers());

  // Start discussion timer
  const discussionTimer = settings.getCurrentSettings().discussionTimer;
  startPhaseTimer(io, discussionTimer, () => {
    startVotingPhase(io);
  });
}

/**
 * Start voting phase
 */
function startVotingPhase(io) {
  logger.game("Starting voting phase");

  gameState.setPhase("voting");
  gameState.clearVotes();

  io.emit("gamePhaseChanged", "voting");

  // Start voting timer
  const votingTimer = settings.getCurrentSettings().votingTimer;
  startPhaseTimer(io, votingTimer, () => {
    processVotingPhase(io);
  });
}

/**
 * Process voting phase results
 */
function processVotingPhase(io) {
  logger.game("Processing voting phase");

  const votes = gameState.getVotes();
  const results = gameLogic.processVotes(votes, gameState.getPlayers());

  // Apply voting results
  if (results.eliminated) {
    gameState.killPlayer(results.eliminated.id);
  }

  // Check win condition
  const winCheck = gameLogic.checkWinCondition(gameState.getPlayers());
  if (winCheck.gameOver) {
    endGame(io, winCheck);
    return;
  }

  // Move to results phase
  gameState.setPhase("results");

  io.emit("roundResults", results);
  io.emit("gamePhaseChanged", "results");
  io.emit("playersUpdated", gameState.getPlayers());

  // Auto-continue to next night after delay
  setTimeout(() => {
    startNightPhase(io);
  }, 5000);
}

/**
 * End the game
 */
function endGame(io, winResult) {
  logger.game(`Game over - ${winResult.winner} wins!`);

  gameState.setPhase("game_over");

  io.emit("gameOver", {
    winner: winResult.winner,
    reason: winResult.reason,
    players: gameState.getPlayers(),
  });

  // Reset game after delay
  setTimeout(() => {
    gameState.resetGame();
  }, 30000);
}

/**
 * Start a phase timer
 */
function startPhaseTimer(io, duration, onComplete) {
  let timeLeft = duration;

  const timer = setInterval(() => {
    io.emit("timerUpdate", timeLeft);
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timer);
      onComplete();
    }
  }, 1000);

  return timer;
}

module.exports = { setupSocketEvents };
