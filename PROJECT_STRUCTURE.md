# Project Structure

```
Lan-mafia/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry point (splash)
│   ├── splash.tsx         # Splash screen component
│   ├── home.tsx           # Home screen (player setup)
│   ├── host-game.tsx      # Host game screen
│   ├── join-game.tsx      # Join game screen
│   └── game.tsx           # Main game screen
├── assets/                 # Static assets
│   ├── images/            # App images and logos
│   └── fonts/             # Custom fonts
├── server/                # Game server
│   ├── hostServer.js      # Express + Socket.IO server
│   ├── package.json       # Server dependencies
│   └── node_modules/      # Server dependencies
├── types/                 # TypeScript type definitions
│   └── game.ts           # Game state and player types
├── utils/                 # Utility functions
│   ├── gameLogic.ts      # Game logic helpers
│   ├── networkUtils.ts   # Network utilities
│   ├── socketManager.ts  # Socket.IO client manager
│   └── theme.ts          # App theme configuration
├── android/              # Android native code
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore patterns
├── app.json             # Expo app configuration
├── eas.json             # Expo Application Services config
├── package.json         # Main app dependencies
├── tsconfig.json        # TypeScript configuration
├── README.md            # Project documentation
├── GAME_SUMMARY.md      # Game rules and mechanics
├── HOTSPOT_SETUP.md     # Network setup guide
├── INSTALL_ON_PHONES.md # Installation instructions
└── TROUBLESHOOTING.md   # Common issues and solutions
```

## Key Files

- **app/**: Contains all React Native screens using Expo Router
- **server/**: Node.js server for multiplayer game coordination
- **utils/**: Shared utilities for networking, game logic, and state management
- **types/**: TypeScript definitions for type safety
- **assets/**: Images, fonts, and other static resources

## Scripts

- `npm start`: Start Expo development server
- `npm run server`: Start game server
- `npm run android`: Build and run on Android
- `npm run clean`: Clean and reinstall dependencies
