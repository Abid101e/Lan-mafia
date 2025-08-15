/**
 * Error Handler Utilities for LAN Mafia Server
 *
 * Centralized error handling and response formatting
 * for consistent error management across the application.
 */

const logger = require("./logger");

/**
 * Error types for the game
 */
const ERROR_TYPES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  GAME_STATE_ERROR: "GAME_STATE_ERROR",
  PLAYER_ERROR: "PLAYER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

/**
 * Custom error class for game-specific errors
 */
class GameError extends Error {
  constructor(message, type = ERROR_TYPES.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = "GameError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle socket errors and send appropriate response
 * @param {Object} socket - Socket.io socket instance
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 */
function handleSocketError(socket, error, context = "unknown") {
  logger.error(`Socket error in ${context}:`, {
    error: error.message,
    stack: error.stack,
    socketId: socket.id,
  });

  // Send error to client
  socket.emit("error", {
    message:
      error instanceof GameError
        ? error.message
        : "An unexpected error occurred",
    type: error instanceof GameError ? error.type : ERROR_TYPES.INTERNAL_ERROR,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle game logic errors
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @returns {Object} Error response object
 */
function handleGameError(error, context = "game") {
  logger.error(`Game error in ${context}:`, {
    error: error.message,
    stack: error.stack,
  });

  return {
    success: false,
    error: {
      message:
        error instanceof GameError ? error.message : "Game error occurred",
      type:
        error instanceof GameError ? error.type : ERROR_TYPES.GAME_STATE_ERROR,
      context,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle validation errors
 * @param {Object} validationResult - Result from validation function
 * @param {string} context - Context where validation failed
 * @returns {GameError} Formatted game error
 */
function createValidationError(validationResult, context = "validation") {
  return new GameError(
    validationResult.message || "Validation failed",
    ERROR_TYPES.VALIDATION_ERROR,
    { context, validationResult }
  );
}

/**
 * Handle player permission errors
 * @param {string} playerId - ID of player attempting action
 * @param {string} action - Action being attempted
 * @returns {GameError} Permission error
 */
function createPermissionError(playerId, action) {
  return new GameError(
    `Player ${playerId} does not have permission to ${action}`,
    ERROR_TYPES.PERMISSION_ERROR,
    { playerId, action }
  );
}

/**
 * Handle game state errors
 * @param {string} message - Error message
 * @param {Object} gameState - Current game state
 * @returns {GameError} Game state error
 */
function createGameStateError(message, gameState = null) {
  return new GameError(message, ERROR_TYPES.GAME_STATE_ERROR, {
    gameState: gameState ? gameState.getCurrentPhase() : null,
  });
}

/**
 * Handle player-related errors
 * @param {string} message - Error message
 * @param {string} playerId - Player ID involved
 * @returns {GameError} Player error
 */
function createPlayerError(message, playerId = null) {
  return new GameError(message, ERROR_TYPES.PLAYER_ERROR, { playerId });
}

/**
 * Wrap async functions with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error("Async operation failed:", {
        error: error.message,
        stack: error.stack,
        function: fn.name,
      });
      throw error;
    }
  };
}

/**
 * Error response formatter for HTTP endpoints
 * @param {Object} res - Express response object
 * @param {Error} error - Error to format
 * @param {number} statusCode - HTTP status code
 */
function sendErrorResponse(res, error, statusCode = 500) {
  const errorResponse = {
    success: false,
    error: {
      message:
        error instanceof GameError ? error.message : "Internal server error",
      type:
        error instanceof GameError ? error.type : ERROR_TYPES.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
    },
  };

  // Don't expose stack traces in production
  if (process.env.NODE_ENV !== "production" && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  logger.error("HTTP error response:", {
    statusCode,
    error: error.message,
    stack: error.stack,
  });

  res.status(statusCode).json(errorResponse);
}

/**
 * Global uncaught exception handler
 */
function setupGlobalErrorHandlers() {
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", {
      error: error.message,
      stack: error.stack,
    });

    // Graceful shutdown
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection:", {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : null,
      promise,
    });
  });
}

module.exports = {
  ERROR_TYPES,
  GameError,
  handleSocketError,
  handleGameError,
  createValidationError,
  createPermissionError,
  createGameStateError,
  createPlayerError,
  asyncErrorHandler,
  sendErrorResponse,
  setupGlobalErrorHandlers,
};
