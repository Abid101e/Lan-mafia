import { GameState, Player, Role } from '../types/game';

export const DEFAULT_GAME_SETTINGS = {
  totalPlayers: 8,
  killers: 2,
  healers: 1,
  police: 1,
};

export function assignRoles(players: Player[], settings = DEFAULT_GAME_SETTINGS): Player[] {
  const roles: Role[] = [];
  
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

export function checkWinCondition(gameState: GameState): 'Killers' | 'Civilians' | null {
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

export function processNightActions(gameState: GameState): GameState['nightResults'] {
  const results = {
    killed: [] as string[],
    healed: [] as string[],
    investigated: [] as string[],
  };
  
  // Process killer actions
  const killerActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Killer' && p.nightAction?.targetId)
    .map(p => p.nightAction!.targetId!);
  
  // Process healer actions
  const healerActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Healer' && p.nightAction?.targetId)
    .map(p => p.nightAction!.targetId!);
  
  // Process police actions
  const policeActions = gameState.players
    .filter(p => p.isAlive && p.role === 'Police' && p.nightAction?.targetId)
    .map(p => p.nightAction!.targetId!);
  
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

export function processVoting(gameState: GameState): { eliminatedPlayer: string; role: Role } | null {
  const voteCounts: { [playerId: string]: number } = {};
  
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

export function getRoleDescription(role: Role): string {
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

export function getRoleEmoji(role: Role): string {
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

export function getRoleImage(role: Role | null): any {
  switch (role) {
    case 'Killer':
      return require('../assets/images/mafia.jpg');
    case 'Healer':
      return require('../assets/images/healer.jpg');
    case 'Police':
      return require('../assets/images/police.jpg');
    case 'Civilian':
    default:
      return require('../assets/images/logo.jpg');
  }
} 