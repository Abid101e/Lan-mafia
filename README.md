# LAN Mafia 🎭

A mobile/web-based offline multiplayer deduction game inspired by Mafia/Werewolf. Play with friends over local WiFi without internet!

## 🌟 Features

- **Offline Multiplayer**: Connect over local WiFi or hotspot
- **Role-Based Gameplay**: Killers, Healers, Police, and Civilians
- **Automated Game Master**: Host device manages all game logic
- **Private Role Reveal**: Each player sees their role only
- **Night/Day Cycles**: Strategic night actions and day voting
- **Cross-Platform**: Works on Android, iOS, and Web
- **Modern UI**: Dark mafia theme with smooth animations

## 🎮 How to Play

### Roles

- **🔪 Killers**: Eliminate civilians each night
- **💊 Healers**: Protect players from death
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
