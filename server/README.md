# LAN Mafia Server

This is the backend server for the LAN Mafia game, built with Node.js, Express, and Socket.io for real-time multiplayer gameplay.

## 📁 Server Structure

```
server/
├── index.js              # Main server entry point
├── socketEvents.js        # WebSocket event handlers
├── gameLogic.js          # Core game mechanics
├── state.js              # Game state management
├── settings.js           # Game settings and configuration
├── config.js             # Server configuration management
├── package.json          # Dependencies and scripts
└── utils/
    ├── logger.js         # Centralized logging utility
    ├── validation.js     # Input validation functions
    ├── errorHandler.js   # Error handling utilities
    ├── testing.js        # Testing and development utilities
    ├── shuffle.js        # Array shuffling utilities
    └── roleBuilder.js    # Role assignment utilities
```

## 🎮 Core Components

### Main Server (`index.js`)

- **Purpose**: Entry point for the server application
- **Features**:
  - Express HTTP server setup
  - Socket.io WebSocket server
  - CORS configuration for LAN access
  - Health check endpoints
  - Development testing endpoints
  - Graceful shutdown handling

### Socket Events (`socketEvents.js`)

- **Purpose**: Handles all real-time communication between clients and server
- **Events Handled**:
  - `hostGame` - Player creates a new game
  - `joinGame` - Player joins existing game
  - `startGame` - Host starts the game with settings
  - `nightAction` - Players perform night phase actions
  - `vote` - Players vote during voting phase
  - `disconnect` - Handle player disconnections

### Game Logic (`gameLogic.js`)

- **Purpose**: Core game mechanics and rule processing
- **Functions**:
  - `assignRoles()` - Randomly assign roles to players
  - `processNightActions()` - Handle kills, heals, investigations
  - `processVotes()` - Process voting results
  - `checkWinCondition()` - Determine if game has ended
  - `areAllActionsComplete()` - Check if phase can advance

### Game State (`state.js`)

- **Purpose**: Centralized state management for game data
- **Manages**:
  - Player list and status
  - Current game phase
  - Host designation
  - Night actions and votes
  - Role assignments
  - Round tracking

### Settings (`settings.js`)

- **Purpose**: Host-configurable game settings
- **Settings**:
  - Role distribution (killers, healers, police, townspeople)
  - Phase timers (night, discussion, voting)
  - Game rules (self-heal, role reveal, etc.)
  - Player count limits

## 🛠 Utility Functions

### Logger (`utils/logger.js`)

- **Purpose**: Centralized logging with different levels
- **Features**:
  - Console logging with emojis
  - Optional file logging
  - Different log levels (error, warn, info, debug)
  - Game-specific logging methods

### Validation (`utils/validation.js`)

- **Purpose**: Input validation and sanitization
- **Validates**:
  - Player names (length, characters, inappropriate words)
  - Game settings (player counts, timers, role distribution)
  - Socket data integrity
  - Player actions

### Error Handler (`utils/errorHandler.js`)

- **Purpose**: Centralized error handling and response formatting
- **Features**:
  - Custom GameError class
  - Socket error handling
  - HTTP error responses
  - Global exception handling
  - Error type categorization

### Testing (`utils/testing.js`)

- **Purpose**: Development and testing utilities
- **Features**:
  - Automated test suites
  - Test player generation
  - Game simulation
  - Validation testing

### Shuffle (`utils/shuffle.js`)

- **Purpose**: Random array shuffling for fair gameplay
- **Functions**:
  - Fisher-Yates shuffle algorithm
  - Random element selection
  - Weighted random selection

### Role Builder (`utils/roleBuilder.js`)

- **Purpose**: Role list creation and validation
- **Features**:
  - Build role arrays from settings
  - Validate role distribution
  - Recommended role configurations
  - Auto-balance role counts

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

- Uses nodemon for auto-restart
- Enables debug logging
- Provides test endpoints

### Production Mode

```bash
npm start
```

- Optimized for performance
- Reduced logging
- No test endpoints

## 🔧 Configuration

The server can be configured through environment variables:

```bash
# Server settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Game settings
MAX_PLAYERS=20
MIN_PLAYERS=4

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Development
ENABLE_DEBUG=true
```

## 📡 API Endpoints

### Health Check

- **GET** `/` - Server status and basic info
- **GET** `/game-state` - Current game state

### Development Endpoints (non-production only)

- **GET** `/test` - Run server test suite
- **POST** `/dev/test-players` - Generate test players
- **POST** `/dev/simulate-game` - Simulate a complete game
- **POST** `/dev/reset` - Reset game state

## 🎯 Game Flow

1. **Lobby Phase**

   - Players connect and join game
   - Host configures settings
   - Minimum player requirement check

2. **Role Assignment**

   - Roles randomly distributed
   - Players receive their roles
   - Brief role reveal period

3. **Night Phase**

   - Killers choose targets
   - Healers choose who to protect
   - Police investigate players
   - Timer-based phase progression

4. **Discussion Phase**

   - Players discuss events
   - Share information and suspicions
   - Plan voting strategy

5. **Voting Phase**

   - Players vote to eliminate suspects
   - Majority vote determines elimination
   - Tie votes result in no elimination

6. **Results Phase**
   - Show voting results
   - Check win conditions
   - Continue to next round or end game

## 🏆 Win Conditions

- **Town Wins**: All killers eliminated
- **Mafia Wins**: Killers equal or outnumber townspeople

## 🛡 Security Features

- Input validation and sanitization
- Rate limiting protection
- CORS configuration for LAN access
- Error handling to prevent crashes
- Graceful shutdown handling

## 🐛 Development Tools

- Comprehensive logging system
- Automated testing utilities
- Game simulation for testing
- Development endpoints
- Error debugging tools

## 📊 Performance Considerations

- Efficient state management
- Minimal data broadcasting
- Timer-based cleanup
- Memory usage monitoring
- Connection handling optimization

## 🔄 Future Enhancements

- Multiple simultaneous games
- Player statistics tracking
- Spectator mode
- Voice chat integration
- Custom role creation
- Tournament mode
