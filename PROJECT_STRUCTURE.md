lan-mafia/
├── client/                            # 📱 React Native (Expo) mobile app
│   ├── App.js
│   ├── constants/                     # Role lists, phase labels, config defaults
│   │   └── roles.js
│   ├── navigation/                   # Stack or tab navigators (optional)
│   │   └── AppNavigator.js
│   ├── screens/                       # Each screen in the game flow
│   │   ├── LobbyScreen.js
│   │   ├── HostSettingsScreen.js
│   │   ├── RoleRevealScreen.js
│   │   ├── NightPhaseScreen.js
│   │   ├── DiscussionScreen.js
│   │   ├── VotingScreen.js
│   │   ├── ResultScreen.js
│   │   └── WinScreen.js
│   ├── components/                    # Reusable UI components
│   │   ├── PlayerCard.js
│   │   ├── RoleCard.js
│   │   ├── VoteButton.js
│   │   └── TimerBar.js
│   ├── utils/
│   │   ├── socket.js                  # Connects client to host
│   │   ├── gamePhases.js              # Phase enums and transitions
│   │   └── soundPlayer.js             # Handles narrator voice or SFX
│   ├── assets/                        # 🖼️ Audio + image assets
│   │   ├── voices/
│   │   │   ├── killer_wakeup.mp3
│   │   │   └── vote_now.mp3
│   │   ├── icons/
│   │   │   └── role_icons.png
│   │   └── splash.png
│   └── app.json                       # Expo config

├── server/                            # 🧠 Local host logic (runs on host phone/laptop)
│   ├── index.js                       # Starts socket.io server
│   ├── socketEvents.js                # All socket event bindings
│   ├── gameLogic.js                   # Core logic: role assignment, action resolution
│   ├── state.js                       # Stores players, roles, game progress
│   ├── settings.js                    # Host-selected role config
│   ├── utils/
│   │   ├── shuffle.js                 # Helper to randomize roles
│   │   └── roleBuilder.js             # Create role list from config
│   └── README.md

├── docs/
│   ├── PROJECT_OVERVIEW.md            # Full game description
│   ├── GAME_FLOW.md                   # Detailed flow of phases and events
│   └── UI_MOCKUPS/                    # Optional exported screenshots

├── .gitignore
├── README.md                          # Copilot-friendly root context
└── package.json (for server)
