/**
 * Server Status Check for LAN Mafia
 *
 * Comprehensive check to verify all server components are properly configured
 * and working together.
 */

const fs = require("fs");
const path = require("path");

/**
 * Check if all required files exist
 */
function checkRequiredFiles() {
  const requiredFiles = [
    "index.js",
    "socketEvents.js",
    "gameLogic.js",
    "state.js",
    "settings.js",
    "config.js",
    "package.json",
    "utils/logger.js",
    "utils/validation.js",
    "utils/errorHandler.js",
    "utils/testing.js",
    "utils/shuffle.js",
    "utils/roleBuilder.js",
  ];

  const missing = [];
  const serverPath = __dirname;

  requiredFiles.forEach((file) => {
    const fullPath = path.join(serverPath, "..", file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  });

  return {
    allPresent: missing.length === 0,
    missing,
  };
}

/**
 * Check if all modules can be imported without errors
 */
function checkModuleImports() {
  const modules = [
    "./index",
    "./socketEvents",
    "./gameLogic",
    "./state",
    "./settings",
    "./config",
    "./utils/logger",
    "./utils/validation",
    "./utils/errorHandler",
    "./utils/testing",
    "./utils/shuffle",
    "./utils/roleBuilder",
  ];

  const failed = [];

  modules.forEach((module) => {
    try {
      require(module);
    } catch (error) {
      failed.push({
        module,
        error: error.message,
      });
    }
  });

  return {
    allImporting: failed.length === 0,
    failed,
  };
}

/**
 * Check configuration integration
 */
function checkConfigurationIntegration() {
  const issues = [];

  try {
    const config = require("../config");

    // Check if config can be initialized
    config.initialize();

    // Check if key settings are accessible
    const serverPort = config.get("server.port");
    const maxPlayers = config.get("game.maxPlayers");
    const corsOrigin = config.get("server.cors.origin");

    if (!serverPort) issues.push("Server port not configured");
    if (!maxPlayers) issues.push("Max players not configured");
    if (!corsOrigin) issues.push("CORS origin not configured");
  } catch (error) {
    issues.push(`Config initialization failed: ${error.message}`);
  }

  return {
    fullyIntegrated: issues.length === 0,
    issues,
  };
}

/**
 * Check game logic functionality
 */
function checkGameLogicFunctionality() {
  const issues = [];

  try {
    const gameLogic = require("../gameLogic");
    const { generateTestPlayers } = require("../utils/testing");

    // Test role assignment
    const testPlayers = generateTestPlayers(6);
    const testSettings = {
      totalPlayers: 6,
      killers: 2,
      healers: 1,
      police: 1,
      townspeople: 2,
    };

    const assignments = gameLogic.assignRoles(testPlayers, testSettings);
    if (assignments.length !== 6) {
      issues.push("Role assignment not working properly");
    }

    // Test night actions
    const nightActions = [
      { playerId: "1", action: "kill", target: "2", role: "killer" },
    ];
    const nightResults = gameLogic.processNightActions(
      nightActions,
      testPlayers
    );
    if (!nightResults || !nightResults.deaths) {
      issues.push("Night action processing not working");
    }

    // Test voting
    const votes = [
      { playerId: "1", targetId: "2" },
      { playerId: "3", targetId: "2" },
    ];
    const voteResults = gameLogic.processVotes(votes, testPlayers);
    if (!voteResults || !voteResults.votes) {
      issues.push("Vote processing not working");
    }
  } catch (error) {
    issues.push(`Game logic test failed: ${error.message}`);
  }

  return {
    fullyFunctional: issues.length === 0,
    issues,
  };
}

/**
 * Check state management
 */
function checkStateManagement() {
  const issues = [];

  try {
    const gameState = require("../state");

    // Test basic state operations
    gameState.reset();
    const player = gameState.addPlayer("test_socket", "TestPlayer", true);

    if (!player || !player.id) {
      issues.push("Player addition not working");
    }

    if (gameState.getPlayerCount() !== 1) {
      issues.push("Player count tracking not working");
    }

    if (!gameState.isHost("test_socket")) {
      issues.push("Host detection not working");
    }

    gameState.setPhase("night");
    if (gameState.getCurrentPhase() !== "night") {
      issues.push("Phase management not working");
    }
  } catch (error) {
    issues.push(`State management test failed: ${error.message}`);
  }

  return {
    fullyFunctional: issues.length === 0,
    issues,
  };
}

/**
 * Check validation system
 */
function checkValidationSystem() {
  const issues = [];

  try {
    const {
      validatePlayerName,
      validateGameSettings,
    } = require("../utils/validation");

    // Test player name validation
    const validName = validatePlayerName("ValidPlayer");
    if (!validName.valid) {
      issues.push("Player name validation rejecting valid names");
    }

    const invalidName = validatePlayerName("");
    if (invalidName.valid) {
      issues.push("Player name validation accepting invalid names");
    }

    // Test game settings validation
    const validSettings = validateGameSettings({
      totalPlayers: 6,
      roles: { killers: 2, healers: 1, police: 1, townspeople: 2 },
    });
    if (!validSettings.valid) {
      issues.push("Game settings validation rejecting valid settings");
    }
  } catch (error) {
    issues.push(`Validation test failed: ${error.message}`);
  }

  return {
    fullyFunctional: issues.length === 0,
    issues,
  };
}

/**
 * Check error handling system
 */
function checkErrorHandling() {
  const issues = [];

  try {
    const { GameError, ERROR_TYPES } = require("../utils/errorHandler");

    // Test custom error creation
    const testError = new GameError("Test error", ERROR_TYPES.VALIDATION_ERROR);
    if (!testError.type || testError.type !== ERROR_TYPES.VALIDATION_ERROR) {
      issues.push("Custom error creation not working");
    }
  } catch (error) {
    issues.push(`Error handling test failed: ${error.message}`);
  }

  return {
    fullyFunctional: issues.length === 0,
    issues,
  };
}

/**
 * Check logging system
 */
function checkLoggingSystem() {
  const issues = [];

  try {
    const logger = require("../utils/logger");

    // Test logging methods exist and can be called
    if (typeof logger.info !== "function") {
      issues.push("Logger info method not available");
    }
    if (typeof logger.error !== "function") {
      issues.push("Logger error method not available");
    }
    if (typeof logger.game !== "function") {
      issues.push("Logger game method not available");
    }

    // Test logging doesn't crash
    logger.info("Test log message");
  } catch (error) {
    issues.push(`Logging test failed: ${error.message}`);
  }

  return {
    fullyFunctional: issues.length === 0,
    issues,
  };
}

/**
 * Run comprehensive server status check
 */
function runCompleteStatusCheck() {
  console.log("🔍 Running comprehensive server status check...\n");

  const results = {
    fileCheck: checkRequiredFiles(),
    importCheck: checkModuleImports(),
    configCheck: checkConfigurationIntegration(),
    gameLogicCheck: checkGameLogicFunctionality(),
    stateCheck: checkStateManagement(),
    validationCheck: checkValidationSystem(),
    errorHandlingCheck: checkErrorHandling(),
    loggingCheck: checkLoggingSystem(),
  };

  // Summary
  let totalChecks = 0;
  let passedChecks = 0;

  Object.entries(results).forEach(([checkName, result]) => {
    totalChecks++;
    const passed =
      result.allPresent ||
      result.allImporting ||
      result.fullyIntegrated ||
      result.fullyFunctional;

    if (passed) {
      passedChecks++;
      console.log(`✅ ${checkName}: PASSED`);
    } else {
      console.log(`❌ ${checkName}: FAILED`);
      if (result.missing) {
        console.log(`   Missing files: ${result.missing.join(", ")}`);
      }
      if (result.failed) {
        result.failed.forEach((failure) => {
          console.log(`   Import failed: ${failure.module} - ${failure.error}`);
        });
      }
      if (result.issues) {
        result.issues.forEach((issue) => {
          console.log(`   Issue: ${issue}`);
        });
      }
    }
  });

  console.log(
    `\n📊 Overall Status: ${passedChecks}/${totalChecks} checks passed`
  );

  if (passedChecks === totalChecks) {
    console.log("🎉 All server configuration is complete and functional!");
  } else {
    console.log(
      "⚠️  Some issues need to be addressed for optimal functionality."
    );
  }

  return {
    success: passedChecks === totalChecks,
    score: `${passedChecks}/${totalChecks}`,
    results,
  };
}

module.exports = {
  checkRequiredFiles,
  checkModuleImports,
  checkConfigurationIntegration,
  checkGameLogicFunctionality,
  checkStateManagement,
  checkValidationSystem,
  checkErrorHandling,
  checkLoggingSystem,
  runCompleteStatusCheck,
};
