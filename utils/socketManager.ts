import { io, Socket } from 'socket.io-client';
import { GameState, Player, Role } from '../types/game';

class SocketManager {
  private socket: Socket | null = null;
  private listeners: { [key: string]: Function[] } = {};

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.emit('disconnected');
        });

        // Set up game event listeners
        this.setupGameEventListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupGameEventListeners() {
    if (!this.socket) return;

    // Game state events
    this.socket.on('game_state', (gameState: GameState) => {
      this.emit('gameStateUpdated', gameState);
    });

    this.socket.on('player_joined', (data: { player: Player }) => {
      this.emit('playerJoined', data.player);
    });

    this.socket.on('player_left', (data: { playerId: string }) => {
      this.emit('playerLeft', data.playerId);
    });

    this.socket.on('game_started', (data: { gameState: GameState }) => {
      this.emit('gameStarted', data.gameState);
    });

    this.socket.on('phase_changed', (data: { phase: string; gameState: GameState }) => {
      this.emit('phaseChanged', data);
    });

    // Role assignment
    this.socket.on('role_assigned', (data: { role: Role }) => {
      this.emit('roleAssigned', data.role);
    });

    // Night phase events
    this.socket.on('night_results', (data: { results: any }) => {
      this.emit('nightResults', data.results);
    });

    // Voting events
    this.socket.on('vote_results', (data: { eliminatedPlayer: string; role: Role }) => {
      this.emit('voteResults', data);
    });

    // Game end
    this.socket.on('game_over', (data: { winner: 'Killers' | 'Civilians' }) => {
      this.emit('gameOver', data.winner);
    });

    // Error handling
    this.socket.on('error', (data: { message: string }) => {
      this.emit('error', data.message);
    });
  }

  // Client to server events
  joinGame(name: string) {
    if (this.socket) {
      this.socket.emit('join_game', { name });
    }
  }

  startGame() {
    if (this.socket) {
      this.socket.emit('start_game');
    }
  }

  submitNightAction(targetId: string, action: 'kill' | 'heal' | 'investigate') {
    if (this.socket) {
      this.socket.emit('night_action', { targetId, action });
    }
  }

  submitVote(targetId: string) {
    if (this.socket) {
      this.socket.emit('vote', { targetId });
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.listeners[event]) return;
    
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection management
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = {};
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 