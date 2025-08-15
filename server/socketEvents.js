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

// Global timer tracking
let currentPhaseTimer = null;

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
        console.log(
          `🌙 Night action received: ${action} on ${target} from socket ${socket.id}`
        );

        const player = gameState.getPlayerBySocketId(socket.id);

        if (!player) {
          throw createPlayerError("Player not found", socket.id);
        }

        console.log(
          `🌙 Player ${player.name} (${player.role}) wants to ${action} ${target}`
        );

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
        const nightAction = {
          playerId: player.id,
          action,
          target,
          role: player.role,
        };
        console.log(`🌙 Adding night action:`, nightAction);
        gameState.addNightAction(nightAction);

        const currentNightActions = gameState.getNightActions();
        console.log(`🌙 Current night actions:`, currentNightActions);

        // Check if all night actions are complete
        const allComplete = gameLogic.areAllNightActionsComplete(
          gameState.getPlayers(),
          currentNightActions
        );
        console.log(`🌙 All night actions complete?`, allComplete);

        if (allComplete) {
          console.log(
            "🌙 All players completed actions early - stopping timer and proceeding"
          );
          // Clear the current phase timer since all actions are complete
          if (currentPhaseTimer) {
            clearInterval(currentPhaseTimer);
            currentPhaseTimer = null;
            console.log("⏰ Phase timer cleared - all actions complete");
          }
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
          console.log(
            "🗳️ All players voted early - stopping timer and proceeding"
          );
          // Clear the current phase timer since all votes are complete
          if (currentPhaseTimer) {
            clearInterval(currentPhaseTimer);
            currentPhaseTimer = null;
            console.log("⏰ Phase timer cleared - all votes complete");
          }
          processVotingPhase(io);
        }
      } catch (error) {
        handleSocketError(socket, error, "vote");
      }
    });

    // Discussion phase ready status
    socket.on("discussionReady", (data) => {
      try {
        const player = gameState.getPlayerBySocketId(socket.id);

        if (!player || !player.isAlive) {
          throw createPlayerError(
            "Cannot set ready status - player not found or dead",
            player?.id
          );
        }

        if (gameState.getCurrentPhase() !== "discussion") {
          throw createGameStateError("Not in discussion phase");
        }

        console.log(`💬 ${player.name} is ready to proceed to voting`);

        // Add to ready list if not already there
        if (!gameState.discussionReadyPlayers) {
          gameState.discussionReadyPlayers = [];
        }

        if (!gameState.discussionReadyPlayers.includes(player.id)) {
          gameState.discussionReadyPlayers.push(player.id);
        }

        // Check if all alive players are ready
        const alivePlayers = gameState.getAlivePlayers();
        const allReady = alivePlayers.every((p) =>
          gameState.discussionReadyPlayers.includes(p.id)
        );

        console.log(
          `💬 Discussion ready players: ${gameState.discussionReadyPlayers.length}/${alivePlayers.length}`
        );

        if (allReady && alivePlayers.length > 0) {
          console.log(
            "💬 All players ready for voting - stopping timer and proceeding"
          );
          // Clear the current phase timer since all players are ready
          if (currentPhaseTimer) {
            clearInterval(currentPhaseTimer);
            currentPhaseTimer = null;
            console.log("⏰ Discussion timer cleared - all players ready");
          }

          // Clear the ready status for next round
          gameState.discussionReadyPlayers = [];

          startVotingPhase(io);
        } else {
          // Broadcast ready status update
          io.emit("discussionReadyUpdate", {
            readyCount: gameState.discussionReadyPlayers.length,
            totalCount: alivePlayers.length,
            readyPlayers: gameState.discussionReadyPlayers,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, "discussionReady");
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
  const currentSettings = settings.getCurrentSettings();
  const nightTimer =
    currentSettings.nightTimer || currentSettings.timers?.nightTimer || 30;
  console.log("🌙 Night timer setting:", nightTimer);
  console.log("🌙 Current settings:", currentSettings);

  const timer = startPhaseTimer(io, nightTimer, () => {
    processNightPhase(io);
  });

  console.log("🌙 Night phase timer started:", timer ? "success" : "failed");
}

/**
 * Process night phase results
 */
let nightPhaseProcessing = false; // Prevent double processing

function processNightPhase(io) {
  console.log("🌙 processNightPhase called - starting night phase processing");

  if (nightPhaseProcessing) {
    console.log("🌙 Night phase already processing, skipping duplicate call");
    return;
  }

  nightPhaseProcessing = true;
  logger.game("Processing night phase");

  const nightActions = gameState.getNightActions();
  console.log("🌙 Retrieved night actions:", nightActions);

  const players = gameState.getPlayers();
  console.log(
    "🌙 Current players:",
    players.map((p) => ({ name: p.name, role: p.role, isAlive: p.isAlive }))
  );

  const results = gameLogic.processNightActions(nightActions, players);
  console.log("🌙 Night processing results:", results);

  // Apply results to game state
  console.log("🌙 Applying death results:", results.deaths);
  results.deaths.forEach((playerId) => {
    console.log(`🌙 Killing player: ${playerId}`);
    gameState.killPlayer(playerId);
  });

  // Check win condition
  console.log("🌙 Checking win condition...");
  const winCheck = gameLogic.checkWinCondition(gameState.getPlayers());
  console.log("🌙 Win check result:", winCheck);

  if (winCheck.gameOver) {
    console.log("🌙 Game over detected, ending game");
    nightPhaseProcessing = false;
    endGame(io, winCheck);
    return;
  }

  console.log("🌙 No game over, transitioning to discussion phase");
  // Move to discussion phase
  gameState.setPhase("discussion");
  console.log("🌙 Phase set to discussion");

  // Prepare public night results (including public investigation info)
  const publicResults = {
    ...results,
    investigations: results.investigations.map((inv) => ({
      publicMessage: inv.publicMessage,
    })),
  };
  console.log("🌙 Prepared public results:", publicResults);

  console.log("🌙 Emitting nightResults...");
  io.emit("nightResults", publicResults);

  console.log("🌙 Emitting gamePhaseChanged to discussion...");
  io.emit("gamePhaseChanged", "discussion");

  console.log("🌙 Emitting playersUpdated...");
  io.emit("playersUpdated", gameState.getPlayers());

  // Send investigation results privately to investigators
  console.log("🌙 Sending private investigation results...");
  results.investigations.forEach((investigation) => {
    const investigatorPlayer = gameState.getPlayerById(
      investigation.investigator
    );
    if (investigatorPlayer) {
      const investigatorSocket = io.sockets.sockets.get(
        investigatorPlayer.socketId
      );
      if (investigatorSocket) {
        investigatorSocket.emit("investigationResult", {
          targetName: investigation.targetName,
          result: investigation.result,
          message: `Your investigation of ${investigation.targetName} revealed they are ${investigation.result}.`,
        });
        console.log(
          `🔍 Sent investigation result to ${investigatorPlayer.name}: ${investigation.targetName} is ${investigation.result}`
        );
      } else {
        console.log(
          `❌ No socket found for investigator ${investigatorPlayer.name}`
        );
      }
    } else {
      console.log(
        `❌ No investigator player found for ID ${investigation.investigator}`
      );
    }
  });

  // Start discussion timer
  const currentSettings = settings.getCurrentSettings();
  const discussionTimer =
    currentSettings.discussionTimer ||
    currentSettings.timers?.discussionTimer ||
    120;
  console.log("💬 Discussion timer setting:", discussionTimer);
  console.log("💬 Current settings:", currentSettings);
  console.log("💬 Timers structure:", currentSettings.timers);

  // Reset discussion ready players for new discussion phase
  gameState.discussionReadyPlayers = [];
  console.log("💬 Reset discussion ready players for new discussion phase");

  console.log("💬 Starting discussion timer...");
  const timer = startPhaseTimer(io, discussionTimer, () => {
    startVotingPhase(io);
  });

  console.log(
    "💬 Discussion phase timer started:",
    timer ? "success" : "failed"
  );

  nightPhaseProcessing = false; // Reset processing flag
  console.log("🌙 Night phase processing completed successfully");
}

/**
 * Start voting phase
 */
function startVotingPhase(io) {
  logger.game("Starting voting phase");

  gameState.setPhase("voting");
  gameState.clearVotes();

  io.emit("gamePhaseChanged", "voting");
  io.emit("playersUpdated", gameState.getPlayers());

  // Start voting timer
  const currentSettings = settings.getCurrentSettings();
  const votingTimer =
    currentSettings.votingTimer || currentSettings.timers?.votingTimer || 60;
  console.log("🗳️ Voting timer setting:", votingTimer);

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
  console.log("🏁 endGame called with result:", winResult);
  logger.game(`Game over - ${winResult.winner} wins!`);

  gameState.setPhase("game_over");
  console.log("🏁 Game phase set to game_over");

  const gameOverData = {
    winner: winResult.winner,
    reason: winResult.reason,
    players: gameState.getPlayers(),
  };

  console.log("🏁 Emitting gameOver event with data:", gameOverData);
  io.emit("gameOver", gameOverData);

  console.log("🏁 Game over event emitted successfully");

  // Reset game after delay
  setTimeout(() => {
    console.log("🏁 Resetting game after delay");
    gameState.resetGame();
  }, 30000);
}

/**
 * Start a phase timer
 */
function startPhaseTimer(io, duration, onComplete) {
  console.log("⏰ Starting phase timer with duration:", duration);

  // Clear any existing timer first
  if (currentPhaseTimer) {
    console.log("⏰ Clearing previous timer");
    clearInterval(currentPhaseTimer);
    currentPhaseTimer = null;
  }

  if (!duration || duration <= 0) {
    console.log("❌ Invalid timer duration:", duration);
    return null;
  }

  let timeLeft = duration;

  currentPhaseTimer = setInterval(() => {
    console.log("⏰ Timer tick, timeLeft:", timeLeft);
    io.emit("timerUpdate", timeLeft);
    timeLeft--;

    if (timeLeft < 0) {
      console.log("⏰ Timer completed, calling onComplete");
      clearInterval(currentPhaseTimer);
      currentPhaseTimer = null;
      onComplete();
    }
  }, 1000);

  return currentPhaseTimer;
}

module.exports = { setupSocketEvents };
