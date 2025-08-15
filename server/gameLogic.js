/**
 * Core Game Logic for LAN Mafia
 *
 * Contains all the game mechanics, role assignments, action processing,
 * and win condition checking logic.
 */
/**
 * Contains core game logic for LAN Mafia.
 * Functions:
 * - assignRoles(players, config): randomize and distribute roles
 * - resolveNightActions(actions, playerStates): compute kill/heal/inspect outcomes
 * - calculateVoteResults(votes): determine who is eliminated
 * - checkWinCondition(players): returns 'civilians', 'killers', or null
 */


const { shuffle } = require("./utils/shuffle");
const { buildRoleList } = require("./utils/roleBuilder");

/**
 * Assign roles to players based on game settings
 * @param {Array} players - List of connected players
 * @param {Object} settings - Game configuration
 * @returns {Array} Role assignments for each player
 */
function assignRoles(players, settings) {
  console.log("🎭 Assigning roles to players");

  // Build role list based on settings
  const roles = buildRoleList(settings);

  // Shuffle roles for random assignment
  const shuffledRoles = shuffle([...roles]);

  // Assign roles to players
  const assignments = players.map((player, index) => ({
    playerId: player.id,
    socketId: player.socketId,
    name: player.name,
    role: shuffledRoles[index] || "townsperson",
  }));

  console.log(
    "✅ Roles assigned:",
    assignments.map((a) => `${a.name}: ${a.role}`)
  );

  return assignments;
}

/**
 * Process night phase actions (kills, heals, investigations)
 * @param {Array} actions - List of night actions
 * @param {Array} players - Current player list
 * @returns {Object} Results of night actions
 */
function processNightActions(actions, players) {
  console.log("🌙 Processing night actions:", actions);

  const results = {
    deaths: [],
    heals: [],
    investigations: [],
    message: "",
  };

  // Group actions by type
  const kills = actions.filter((a) => a.action === "kill");
  const heals = actions.filter((a) => a.action === "heal");
  const investigations = actions.filter((a) => a.action === "investigate");

  // Process heals first (they can prevent deaths)
  const healedPlayers = new Set();
  heals.forEach((heal) => {
    healedPlayers.add(heal.target);
    results.heals.push(heal.target);
  });

  // Process kills (check against heals)
  kills.forEach((kill) => {
    if (!healedPlayers.has(kill.target)) {
      results.deaths.push(kill.target);
    }
  });

  // Process investigations
  investigations.forEach((investigation) => {
    const targetPlayer = players.find((p) => p.id === investigation.target);
    if (targetPlayer) {
      const investigatorSocket = players.find(
        (p) => p.id === investigation.playerId
      );
      results.investigations.push({
        investigator: investigation.playerId,
        target: investigation.target,
        result: targetPlayer.role === "killer" ? "suspicious" : "innocent",
      });
    }
  });

  // Generate result message
  if (results.deaths.length > 0) {
    const deadPlayerNames = results.deaths.map(
      (id) => players.find((p) => p.id === id)?.name || "Unknown"
    );
    results.message = `${deadPlayerNames.join(", ")} ${
      deadPlayerNames.length === 1 ? "was" : "were"
    } eliminated during the night.`;
  } else {
    results.message = "No one was eliminated during the night.";
  }

  console.log("🌙 Night results:", results);
  return results;
}

/**
 * Process voting phase results
 * @param {Array} votes - List of player votes
 * @param {Array} players - Current player list
 * @returns {Object} Voting results
 */
function processVotes(votes, players) {
  console.log("🗳️ Processing votes:", votes);

  // Count votes for each target
  const voteCounts = {};
  votes.forEach((vote) => {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  });

  // Find player(s) with most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const topCandidates = Object.keys(voteCounts).filter(
    (playerId) => voteCounts[playerId] === maxVotes
  );

  let eliminated = null;
  let message = "";

  if (topCandidates.length === 1 && maxVotes > 0) {
    // Single player with most votes
    const eliminatedId = topCandidates[0];
    eliminated = players.find((p) => p.id === eliminatedId);
    message = `${eliminated.name} was eliminated by majority vote.`;
  } else if (topCandidates.length > 1) {
    // Tie vote - no elimination
    message = "The vote was tied. No one was eliminated.";
  } else {
    // No votes cast
    message = "No votes were cast. No one was eliminated.";
  }

  const results = {
    votes: voteCounts,
    eliminated,
    message,
    maxVotes,
  };

  console.log("🗳️ Vote results:", results);
  return results;
}

/**
 * Check if the game has ended and determine winner
 * @param {Array} players - Current player list
 * @returns {Object} Win condition result
 */
function checkWinCondition(players) {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveKillers = alivePlayers.filter((p) => p.role === "killer");
  const aliveTownspeople = alivePlayers.filter((p) => p.role !== "killer");

  console.log(
    `🏆 Win check: ${aliveKillers.length} killers, ${aliveTownspeople.length} townspeople`
  );

  // Mafia wins if they equal or outnumber townspeople
  if (aliveKillers.length >= aliveTownspeople.length) {
    return {
      gameOver: true,
      winner: "mafia",
      reason: "The killers have taken control of the town!",
    };
  }

  // Town wins if all killers are eliminated
  if (aliveKillers.length === 0) {
    return {
      gameOver: true,
      winner: "town",
      reason: "All killers have been eliminated!",
    };
  }

  // Game continues
  return {
    gameOver: false,
    winner: null,
    reason: null,
  };
}

/**
 * Check if all night actions are complete
 * @param {Array} players - Current player list
 * @param {Array} actions - Submitted night actions
 * @returns {boolean} True if all required actions are submitted
 */
function areAllNightActionsComplete(players, actions) {
  const alivePlayers = players.filter((p) => p.isAlive);
  const playersWithActions = alivePlayers.filter((p) =>
    ["killer", "healer", "police"].includes(p.role)
  );

  const submittedActions = new Set(actions.map((a) => a.playerId));

  return playersWithActions.every((p) => submittedActions.has(p.id));
}

/**
 * Check if all votes are complete
 * @param {Array} alivePlayers - Players who can vote
 * @param {Array} votes - Submitted votes
 * @returns {boolean} True if all players have voted
 */
function areAllVotesComplete(alivePlayers, votes) {
  const submittedVotes = new Set(votes.map((v) => v.playerId));
  return alivePlayers.every((p) => submittedVotes.has(p.id));
}

module.exports = {
  assignRoles,
  processNightActions,
  processVotes,
  checkWinCondition,
  areAllNightActionsComplete,
  areAllVotesComplete,
};
