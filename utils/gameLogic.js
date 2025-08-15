// Game logic utilities for LAN Mafia

const DEFAULT_GAME_SETTINGS = {
  totalPlayers: 8,
  killers: 2,
  healers: 1,
  police: 1,
};

function assignRoles(players, settings = DEFAULT_GAME_SETTINGS) {
  const roles = [];
  
  // Add killers
  for (let i = 0; i < settings.killers; i++) {
    roles.push('Killer');
  }
  
  // Add healers
  for (let i = 0; i < settings.healers; i++) {
    roles.push('Healer');
  }
  
  // Add police
  for (let i = 0; i < settings.police; i++) {
    roles.push('Police');
  }
  
  // Fill remaining with civilians
  const civiliansNeeded = settings.totalPlayers - settings.killers - settings.healers - settings.police;
  for (let i = 0; i < civiliansNeeded; i++) {
    roles.push('Civilian');
  }
  
  // Shuffle roles
  const shuffledRoles = roles.sort(() => Math.random() - 0.5);
  
  // Assign roles to players
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    isAlive: true,
  }));
}

function checkWinCondition(gameState) {
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
  const aliveCivilians = alivePlayers.filter(p => p.role !== 'Killer');
  
  // Killers win if they outnumber or equal civilians
  if (aliveKillers.length >= aliveCivilians.length) {
    return 'Killers';
  }
  
  // Civilians win if all killers are eliminated
  if (aliveKillers.length === 0) {
    return 'Civilians';
  }
  
  return null;
}

function processNightActions(gameState) {
  const results = {
    killed: [],
    healed: [],
    investigated: [],
  };
  
  // Process killer actions
  const killerActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Killer' && p.nightAction?.targetId)
    .map(p => p.nightAction.targetId);
  
  // Process healer actions
  const healerActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Healer' && p.nightAction?.targetId)
    .map(p => p.nightAction.targetId);
  
  // Process police actions
  const policeActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Police' && p.nightAction?.targetId)
    .map(p => p.nightAction.targetId);
  
  // Determine who gets killed (killer target - healer protection)
  const killTarget = killerActions[0]; // For simplicity, first killer's choice
  if (killTarget && !healerActions.includes(killTarget)) {
    results.killed.push(killTarget);
  }
  
  // Add healed players
  results.healed.push(...healerActions);
  
  // Add investigated players
  results.investigated.push(...policeActions);
  
  return results;
}

function processVoting(gameState) {
  const voteCounts = {};
  
  // Count votes
  gameState.players.forEach(player => {
    if (player.isAlive && player.vote) {
      voteCounts[player.vote] = (voteCounts[player.vote] || 0) + 1;
    }
  });
  
  // Find player with most votes
  let maxVotes = 0;
  let eliminatedPlayerId = '';
  
  Object.entries(voteCounts).forEach(([playerId, votes]) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      eliminatedPlayerId = playerId;
    }
  });
  
  if (eliminatedPlayerId) {
    const eliminatedPlayer = gameState.players.find(p => p.id === eliminatedPlayerId);
    return {
      eliminatedPlayer: eliminatedPlayerId,
      role: eliminatedPlayer?.role || 'Civilian',
    };
  }
  
  return null;
}

function getRoleDescription(role) {
  switch (role) {
    case 'Killer':
      return 'You are a Killer. Each night, you can choose one player to eliminate. Work with other killers to eliminate all civilians.';
    case 'Healer':
      return 'You are a Healer. Each night, you can choose one player to protect from death. Help the civilians survive.';
    case 'Police':
      return 'You are a Police officer. Each night, you can investigate one player to learn their role. Help identify the killers.';
    case 'Civilian':
      return 'You are a Civilian. You have no special powers, but you can vote during the day to eliminate suspected killers.';
    default:
      return 'Unknown role';
  }
}

function getRoleEmoji(role) {
  switch (role) {
    case 'Killer':
      return '🔪';
    case 'Healer':
      return '💊';
    case 'Police':
      return '👮';
    case 'Civilian':
      return '👤';
    default:
      return '❓';
  }
}

module.exports = {
  DEFAULT_GAME_SETTINGS,
  assignRoles,
  checkWinCondition,
  processNightActions,
  processVoting,
  getRoleDescription,
  getRoleEmoji,
}; 