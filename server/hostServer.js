const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state
let gameState = {
  phase: 'lobby',
  players: [],
  currentRound: 0,
  nightResults: {
    killed: [],
    healed: [],
    investigated: []
  },
  voteResults: {},
  eliminatedPlayer: null,
  winner: null,
  gameSettings: {
    totalPlayers: 8,
    killers: 2,
    healers: 1,
    police: 1
  }
};

// Helper functions
function assignRoles() {
  const roles = [];
  
  // Add killers
  for (let i = 0; i < gameState.gameSettings.killers; i++) {
    roles.push('Killer');
  }
  
  // Add healers
  for (let i = 0; i < gameState.gameSettings.healers; i++) {
    roles.push('Healer');
  }
  
  // Add police
  for (let i = 0; i < gameState.gameSettings.police; i++) {
    roles.push('Police');
  }
  
  // Fill remaining with civilians
  const civiliansNeeded = gameState.gameSettings.totalPlayers - 
    gameState.gameSettings.killers - 
    gameState.gameSettings.healers - 
    gameState.gameSettings.police;
  
  for (let i = 0; i < civiliansNeeded; i++) {
    roles.push('Civilian');
  }
  
  // Shuffle roles
  const shuffledRoles = roles.sort(() => Math.random() - 0.5);
  
  // Assign roles to players
  gameState.players = gameState.players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    isAlive: true,
    nightAction: null,
    vote: null
  }));
}

function checkWinCondition() {
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
  const aliveCivilians = alivePlayers.filter(p => p.role !== 'Killer');
  
  if (aliveKillers.length >= aliveCivilians.length) {
    return 'Killers';
  }
  
  if (aliveKillers.length === 0) {
    return 'Civilians';
  }
  
  return null;
}

function processNightActions() {
  const results = {
    killed: [],
    healed: [],
    investigated: []
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
  
  // Determine who gets killed
  const killTarget = killerActions[0];
  if (killTarget && !healerActions.includes(killTarget)) {
    results.killed.push(killTarget);
    const killedPlayer = gameState.players.find(p => p.id === killTarget);
    if (killedPlayer) {
      killedPlayer.isAlive = false;
    }
  }
  
  results.healed.push(...healerActions);
  results.investigated.push(...policeActions);
  
  return results;
}

function processVoting() {
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
    if (eliminatedPlayer) {
      eliminatedPlayer.isAlive = false;
      return {
        eliminatedPlayer: eliminatedPlayerId,
        role: eliminatedPlayer.role
      };
    }
  }
  
  return null;
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join game
  socket.on('join_game', (data) => {
    const player = {
      id: socket.id,
      name: data.name,
      isAlive: true,
      isHost: gameState.players.length === 0,
      role: null,
      nightAction: null,
      vote: null
    };
    
    gameState.players.push(player);
    
    // Send current game state to new player first
    socket.emit('game_state', gameState);
    
    // Then notify all clients about new player
    io.emit('player_joined', { player });
    
    // Update all clients with current game state
    io.emit('game_state', gameState);
    
    console.log(`Player ${data.name} joined the game. Total players: ${gameState.players.length}`);
  });
  
  // Start game (host only)
  socket.on('start_game', () => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      assignRoles();
      gameState.phase = 'night';
      gameState.currentRound = 1;
      
      // Send roles to each player privately
      gameState.players.forEach(p => {
        io.to(p.id).emit('role_assigned', { role: p.role });
      });
      
      // Send updated game state to all
      io.emit('game_started', gameState);
      
      console.log('Game started');
    }
  });
  
  // Night action
  socket.on('night_action', (data) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && player.isAlive) {
      player.nightAction = {
        targetId: data.targetId,
        action: data.action
      };
      
      // Check if all night actions are complete
      const playersWithActions = gameState.players.filter(p => 
        p.isAlive && ['Killer', 'Healer', 'Police'].includes(p.role) && p.nightAction
      );
      
      const expectedActions = gameState.players.filter(p => 
        p.isAlive && ['Killer', 'Healer', 'Police'].includes(p.role)
      ).length;
      
      if (playersWithActions.length === expectedActions) {
        // Process night actions
        const nightResults = processNightActions();
        gameState.nightResults = nightResults;
        gameState.phase = 'day';
        
        // Reset night actions
        gameState.players.forEach(p => p.nightAction = null);
        
        io.emit('night_results', { results: nightResults });
        io.emit('phase_changed', { phase: 'day', gameState });
      }
    }
  });
  
  // Vote
  socket.on('vote', (data) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && player.isAlive) {
      player.vote = data.targetId;
      
      // Check if all alive players have voted
      const alivePlayers = gameState.players.filter(p => p.isAlive);
      const playersVoted = alivePlayers.filter(p => p.vote);
      
      if (playersVoted.length === alivePlayers.length) {
        // Process voting
        const voteResult = processVoting();
        gameState.phase = 'results';
        
        if (voteResult) {
          gameState.eliminatedPlayer = voteResult.eliminatedPlayer;
          io.emit('vote_results', voteResult);
        }
        
        // Check win condition
        const winner = checkWinCondition();
        if (winner) {
          gameState.winner = winner;
          gameState.phase = 'gameOver';
          io.emit('game_over', { winner });
        } else {
          // Start next round
          gameState.currentRound++;
          gameState.phase = 'night';
          gameState.nightResults = { killed: [], healed: [], investigated: [] };
          gameState.voteResults = {};
          gameState.eliminatedPlayer = null;
          
          // Reset votes
          gameState.players.forEach(p => p.vote = null);
        }
        
        io.emit('phase_changed', { phase: gameState.phase, gameState });
      }
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      const player = gameState.players[playerIndex];
      gameState.players.splice(playerIndex, 1);
      
      io.emit('player_left', { playerId: socket.id });
      
      // Update all clients with current game state
      io.emit('game_state', gameState);
      
      console.log(`Player ${player.name} left the game. Total players: ${gameState.players.length}`);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: gameState.players.length,
    playerNames: gameState.players.map(p => p.name),
    phase: gameState.phase
  });
});

// Get game state endpoint
app.get('/game-state', (req, res) => {
  res.json(gameState);
});

// Function to get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Look for hotspot IP first (most common)
  for (const name of Object.keys(interfaces)) {
    const interface = interfaces[name];
    for (const addr of interface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Check if it's a hotspot IP
        if (addr.address.startsWith('192.168.43.') || 
            addr.address.startsWith('192.168.1.') ||
            addr.address.startsWith('10.0.0.') ||
            addr.address.startsWith('172.20.10.')) {
          return addr.address;
        }
      }
    }
  }
  
  // Fallback to any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    const interface = interfaces[name];
    for (const addr of interface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  
  return 'Unknown';
}

// Debug endpoint to check server
app.get('/debug', (req, res) => {
  res.json({
    serverRunning: true,
    port: PORT,
    connections: io.engine.clientsCount,
    gameState: gameState,
    localIP: getLocalIPAddress(),
    networkInterfaces: os.networkInterfaces()
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`🚀 LAN Mafia server running on port ${PORT}`);
  console.log(`📱 Local IP: ${localIP}`);
  console.log(`🌐 Server URL: http://${localIP}:${PORT}`);
  console.log(`🔍 Health check: http://${localIP}:${PORT}/health`);
  console.log(`🐛 Debug info: http://${localIP}:${PORT}/debug`);
  
  if (localIP === 'Unknown') {
    console.log(`⚠️  WARNING: Could not detect local IP address`);
    console.log(`💡 Make sure your hotspot is turned ON`);
    console.log(`💡 Try using IP: 192.168.43.1`);
  } else {
    console.log(`✅ Server ready for connections!`);
  }
});

module.exports = { app, server, io }; 