# 🎭 LAN Mafia Game

A digital implementation of the classic Mafia party game designed for local area network gameplay. Connect your mobile devices to a host server and enjoy real-time multiplayer social deduction gaming!

## 🎮 Game Overview

LAN Mafia brings the excitement of the traditional Mafia party game to your mobile devices. Players take on secret roles and work to achieve their team's victory through strategy, deception, and social deduction.

### Key Features

- 📱 **Mobile-First Design**: React Native app for iOS and Android
- 🌐 **Local Network Play**: No internet required - perfect for gatherings
- ⚡ **Real-Time Gameplay**: WebSocket-powered live interactions
- 🎯 **Role-Based Abilities**: Killers, Healers, Police, and Townspeople
- ⚙️ **Customizable Settings**: Host can configure roles, timers, and rules
- 👑 **Host Controls**: Dedicated host interface for game management

## 🏗️ Project Structure

```
lan-mafia/
├── client/                     # 📱 React Native (Expo) mobile app
│   ├── App.js                 # Main app entry point
│   ├── constants/             # Game constants and role definitions
│   │   └── roles.js
│   ├── navigation/            # App navigation setup
│   │   └── AppNavigator.js
│   ├── screens/               # Game screen components
│   │   ├── LobbyScreen.js     # Main lobby and joining
│   │   ├── HostSettingsScreen.js  # Game configuration
│   │   ├── RoleRevealScreen.js    # Show assigned roles
│   │   ├── NightPhaseScreen.js    # Night actions interface
│   │   ├── DiscussionScreen.js    # Day phase discussion
│   │   ├── VotingScreen.js        # Voting interface
│   │   ├── ResultScreen.js        # Round results display
│   │   └── WinScreen.js           # Game over screen
│   ├── components/            # Reusable UI components
│   ├── utils/                 # Client utilities
│   │   └── socket.js          # WebSocket connection manager
│   ├── assets/                # Images, sounds, and icons
│   └── app.json              # Expo configuration
│
├── server/                    # 🧠 Node.js game server
│   ├── index.js              # Express server with Socket.io
│   ├── socketEvents.js       # WebSocket event handlers
│   ├── gameLogic.js          # Core game mechanics
│   ├── state.js              # Game state management
│   ├── settings.js           # Configuration management
│   ├── utils/                # Server utilities
│   │   ├── shuffle.js        # Random array shuffling
│   │   └── roleBuilder.js    # Role assignment logic
│   └── package.json          # Server dependencies
│
├── docs/                     # 📚 Documentation
│   ├── PROJECT_OVERVIEW.md   # Detailed project description
│   ├── GAME_FLOW.md          # Complete game flow documentation
│   └── UI_MOCKUPS/           # Design mockups and screenshots
│
├── .gitignore               # Git ignore rules
├── README.md                # This file
└── package.json             # Root package configuration
```

- **👮 Police**: Investigate players' roles
- **👤 Civilians**: Vote to eliminate killers

### Game Flow

1. **Night Phase**: Special roles perform actions secretly
2. **Day Phase**: Group discussion and voting
3. **Results**: See who was killed/eliminated
4. **Repeat** until one team wins

### Win Conditions

- **Killers Win**: When killers outnumber civilians
- **Civilians Win**: When all killers are eliminated

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- All devices on same WiFi network

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Abid101e/Lan-mafia.git
   cd Lan-mafia
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment** (optional)

   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

6. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Game

#### Option 1: Host Device (Runs Server + Client)

1. **Start the server**

   ```bash
   cd server
   npm start
   ```

2. **In another terminal, start the client**

   ```bash
   npm start
   ```

3. **Open the app and tap "Host Game"**

#### Option 2: Client Devices (Join Only)

1. **Start the client**

   ```bash
   npm start
   ```

2. **Open the app and tap "Join Game"**

3. **Enter the host's IP address**

### Network Setup

1. **Find Host IP Address**

   - Host device shows IP in the app
   - Or use `ipconfig` (Windows) / `ifconfig` (Mac/Linux)

2. **Connect All Devices**

   - All players must be on same WiFi network
   - Or use host device's hotspot

3. **Join the Game**
   - Enter host IP address in join screen
   - Wait for host to start the game

## 📱 Game Screens

### Home Screen

- Enter player name
- Choose Host or Join Game
- View game instructions

### Host Screen

- Start game server
- View connected players
- Start the game when ready
- Copy IP address for sharing

### Join Screen

- Enter host IP address
- Connect to game
- Wait in lobby

### Game Screen

- View your secret role
- Perform night actions
- Vote during day phase
- See game results

## 🛠️ Technical Architecture

### Client (React Native + Expo)

- **Socket.IO Client**: Real-time communication
- **Game Logic**: Role management and UI
- **Network Utils**: IP detection and validation

### Server (Node.js + Socket.IO)

- **Game State Management**: Centralized game logic
- **Role Assignment**: Random role distribution
- **Action Processing**: Night actions and voting
- **Win Condition Checking**: Automatic victory detection

### Key Components

```
├── app/                    # Main app screens
│   ├── index.tsx          # Home screen
│   ├── host-game.tsx      # Host game screen
│   ├── join-game.tsx      # Join game screen
│   └── game.tsx           # Main game screen
├── server/                # Socket.IO server
│   ├── hostServer.js      # Main server file
│   └── package.json       # Server dependencies
├── types/                 # TypeScript types
│   └── game.ts           # Game interfaces
├── utils/                 # Utility functions
│   ├── gameLogic.ts      # Game logic helpers
│   ├── networkUtils.ts   # Network utilities
│   └── socketManager.ts  # Socket.IO client manager
└── Screens/              # Legacy screen components
```

## 🎯 Game Rules

### Night Phase

- **Killers**: Choose one player to eliminate
- **Healers**: Choose one player to protect
- **Police**: Choose one player to investigate
- **Civilians**: No action (sleep)

### Day Phase

- **Discussion**: All players discuss and share information
- **Voting**: Each player votes to eliminate one person
- **Results**: Player with most votes is eliminated

### Special Rules

- Healers can protect against killer attacks
- Police investigations reveal player roles
- Dead players cannot vote or perform actions
- Game continues until win condition is met

## 🔧 Development

### Adding New Features

1. Update game types in `types/game.ts`
2. Modify server logic in `server/hostServer.js`
3. Update client UI in appropriate screen files
4. Test with multiple devices

### Customization

- **Roles**: Add new roles in `utils/gameLogic.ts`
- **UI**: Modify styles in screen components
- **Game Rules**: Update logic in server file

## 🐛 Troubleshooting

### Connection Issues

- Ensure all devices on same network
- Check firewall settings
- Verify IP address is correct
- Try using host device's hotspot

### Game Issues

- Restart server if game gets stuck
- Check console for error messages
- Ensure minimum 4 players to start

### Performance Issues

- Close other apps on devices
- Use wired connection for host if possible
- Limit number of players (max 8 recommended)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test with multiple devices
5. Submit pull request

## 📞 Support

For issues and questions:

- Create GitHub issue
- Check troubleshooting section
- Review game rules

---

**Enjoy playing LAN Mafia with your friends! 🎉**
