export type Role = 'Killer' | 'Healer' | 'Police' | 'Civilian';

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting' | 'results' | 'gameOver';

export interface Player {
  id: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  isHost: boolean;
  nightAction?: {
    targetId?: string;
    action: 'kill' | 'heal' | 'investigate';
  };
  vote?: string;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  nightResults: {
    killed: string[];
    healed: string[];
    investigated: string[];
  };
  voteResults: {
    [playerId: string]: number;
  };
  eliminatedPlayer?: string;
  winner?: 'Killers' | 'Civilians';
  gameSettings: {
    totalPlayers: number;
    killers: number;
    healers: number;
    police: number;
  };
}

export interface SocketEvents {
  // Connection events
  join_game: { name: string };
  player_joined: { player: Player };
  player_left: { playerId: string };
  
  // Game flow events
  game_started: { gameState: GameState };
  phase_changed: { phase: GamePhase; gameState: GameState };
  
  // Role assignment
  role_assigned: { role: Role };
  
  // Night actions
  night_action: { targetId: string; action: 'kill' | 'heal' | 'investigate' };
  night_results: { results: GameState['nightResults'] };
  
  // Voting
  vote: { targetId: string };
  vote_results: { eliminatedPlayer: string; role: Role };
  
  // Game end
  game_over: { winner: 'Killers' | 'Civilians' };
  
  // Error handling
  error: { message: string };
} 