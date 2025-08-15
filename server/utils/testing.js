/**
 * Testing Utilities for LAN Mafia Server
 *
 * Provides functions to test game logic, state management,
 * and server functionality for development and debugging.
 */

const gameLogic = require("../gameLogic");
const gameState = require("../state");
const settings = require("../settings");
const { validatePlayerName, validateGameSettings } = require("./validation");
const logger = require("./logger");

/**
 * Test suite for game logic
 */
function testGameLogic() {
  logger.info("Running game logic tests...");

  // Test role assignment
  const testPlayers = [
    { id: "1", name: "Alice", socketId: "socket1" },
    { id: "2", name: "Bob", socketId: "socket2" },
    { id: "3", name: "Charlie", socketId: "socket3" },
    { id: "4", name: "Diana", socketId: "socket4" },
    { id: "5", name: "Eve", socketId: "socket5" },
    { id: "6", name: "Frank", socketId: "socket6" },
  ];

  const testSettings = {
    totalPlayers: 6,
    killers: 2,
    healers: 1,
    police: 1,
    townspeople: 2,
  };

  try {
    const assignments = gameLogic.assignRoles(testPlayers, testSettings);
    logger.info("✅ Role assignment test passed");

    // Test night actions processing
    const nightActions = [
      { playerId: "1", action: "kill", target: "3", role: "killer" },
      { playerId: "4", action: "heal", target: "3", role: "healer" },
      { playerId: "5", action: "investigate", target: "1", role: "police" },
    ];

    const playersWithRoles = testPlayers.map((p, i) => ({
      ...p,
      role: assignments[i].role,
      isAlive: true,
    }));

    const nightResults = gameLogic.processNightActions(
      nightActions,
      playersWithRoles
    );
    logger.info("✅ Night actions processing test passed");

    // Test voting
    const votes = [
      { playerId: "1", targetId: "2" },
      { playerId: "2", targetId: "1" },
      { playerId: "3", targetId: "1" },
      { playerId: "4", targetId: "1" },
    ];

    const voteResults = gameLogic.processVotes(votes, playersWithRoles);
    logger.info("✅ Voting processing test passed");

    // Test win conditions
    const winCheck = gameLogic.checkWinCondition(playersWithRoles);
    logger.info("✅ Win condition check test passed");

    return true;
  } catch (error) {
    logger.error("❌ Game logic test failed:", error);
    return false;
  }
}

/**
 * Test suite for game state management
 */
function testGameState() {
  logger.info("Running game state tests...");

  try {
    // Reset state
    gameState.reset();

    // Test player management
    const player1 = gameState.addPlayer("socket1", "TestPlayer1", true);
    const player2 = gameState.addPlayer("socket2", "TestPlayer2", false);

    if (gameState.getPlayerCount() !== 2) {
      throw new Error("Player count incorrect");
    }

    if (!gameState.isHost("socket1")) {
      throw new Error("Host detection failed");
    }

    // Test phase management
    gameState.setPhase("night");
    if (gameState.getCurrentPhase() !== "night") {
      throw new Error("Phase setting failed");
    }

    // Test actions and votes
    gameState.addNightAction({
      playerId: player1.id,
      action: "kill",
      target: player2.id,
      role: "killer",
    });

    if (gameState.getNightActions().length !== 1) {
      throw new Error("Night action recording failed");
    }

    gameState.addVote(player1.id, player2.id);
    if (gameState.getVotes().length !== 1) {
      throw new Error("Vote recording failed");
    }

    logger.info("✅ Game state management tests passed");
    return true;
  } catch (error) {
    logger.error("❌ Game state test failed:", error);
    return false;
  }
}

/**
 * Test suite for validation functions
 */
function testValidation() {
  logger.info("Running validation tests...");

  try {
    // Test player name validation
    const validName = validatePlayerName("ValidPlayer");
    if (!validName.valid) {
      throw new Error("Valid name rejected");
    }

    const invalidName = validatePlayerName("");
    if (invalidName.valid) {
      throw new Error("Invalid name accepted");
    }

    // Test game settings validation
    const validSettings = validateGameSettings({
      totalPlayers: 6,
      roles: { killers: 2, healers: 1, police: 1, townspeople: 2 },
      timers: { nightTimer: 30, discussionTimer: 120, votingTimer: 60 },
    });
    if (!validSettings.valid) {
      throw new Error("Valid settings rejected");
    }

    const invalidSettings = validateGameSettings({
      totalPlayers: 100, // Too many players
    });
    if (invalidSettings.valid) {
      throw new Error("Invalid settings accepted");
    }

    logger.info("✅ Validation tests passed");
    return true;
  } catch (error) {
    logger.error("❌ Validation test failed:", error);
    return false;
  }
}

/**
 * Test suite for settings management
 */
function testSettings() {
  logger.info("Running settings tests...");

  try {
    // Test default settings
    const defaults = settings.getDefaultSettings();
    if (!defaults || !defaults.totalPlayers) {
      throw new Error("Default settings invalid");
    }

    // Test settings update
    const newSettings = {
      totalPlayers: 8,
      roles: { killers: 2, healers: 1, police: 1, townspeople: 4 },
    };

    const updated = settings.updateSettings(newSettings);
    if (updated.totalPlayers !== 8) {
      throw new Error("Settings update failed");
    }

    // Test settings validation
    const validation = settings.areSettingsValid();
    if (!validation.valid) {
      throw new Error("Valid settings marked as invalid");
    }

    logger.info("✅ Settings management tests passed");
    return true;
  } catch (error) {
    logger.error("❌ Settings test failed:", error);
    return false;
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  logger.info("🧪 Starting comprehensive server tests...");

  const results = {
    gameLogic: testGameLogic(),
    gameState: testGameState(),
    validation: testValidation(),
    settings: testSettings(),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    logger.info(`🎉 All tests passed! (${passed}/${total})`);
  } else {
    logger.error(`❌ Some tests failed. Passed: ${passed}/${total}`);
    Object.entries(results).forEach(([test, result]) => {
      logger.info(`${result ? "✅" : "❌"} ${test}`);
    });
  }

  return results;
}

/**
 * Generate test players for development
 */
function generateTestPlayers(count = 6) {
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
    "Henry",
    "Ivy",
    "Jack",
  ];
  const players = [];

  for (let i = 0; i < Math.min(count, names.length); i++) {
    players.push({
      id: `test_player_${i + 1}`,
      socketId: `test_socket_${i + 1}`,
      name: names[i],
      isHost: i === 0,
      isAlive: true,
      isConnected: true,
      role: null,
      joinedAt: new Date(),
    });
  }

  return players;
}

/**
 * Simulate a game for testing
 */
function simulateGame() {
  logger.info("🎮 Simulating a complete game...");

  try {
    // Reset and setup
    gameState.reset();
    const testPlayers = generateTestPlayers(6);

    // Add players to game state
    testPlayers.forEach((player, index) => {
      gameState.addPlayer(player.socketId, player.name, index === 0);
    });

    // Start game with settings
    const gameSettings = {
      totalPlayers: 6,
      killers: 2,
      healers: 1,
      police: 1,
      townspeople: 2,
    };

    settings.updateSettings(gameSettings);

    // Assign roles
    const assignments = gameLogic.assignRoles(
      gameState.getPlayers(),
      gameSettings
    );
    gameState.setRoleAssignments(assignments);

    logger.info("Game simulation completed successfully");
    return {
      success: true,
      players: gameState.getPlayers(),
      assignments,
    };
  } catch (error) {
    logger.error("Game simulation failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  testGameLogic,
  testGameState,
  testValidation,
  testSettings,
  runAllTests,
  generateTestPlayers,
  simulateGame,
};
