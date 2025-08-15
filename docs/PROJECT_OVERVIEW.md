# LAN Mafia Game Project

## 🎮 Project Overview

LAN Mafia is a digital implementation of the classic Mafia party game, designed for local area network (LAN) gameplay. Players connect their mobile devices to a host server and participate in a thrilling game of deception, strategy, and social deduction.

### Game Concept

- **Players**: 4-20 participants
- **Roles**: Killers (Mafia), Healers (Doctors), Police (Detectives), Townspeople
- **Objective**:
  - **Mafia**: Eliminate townspeople and gain control
  - **Town**: Identify and eliminate all mafia members

### Key Features

- Real-time multiplayer gameplay via WebSocket
- Role-based special abilities
- Timed game phases (Night, Discussion, Voting)
- Host-configurable game settings
- Mobile-first design with intuitive UI
- Local network play (no internet required)

## 🏗️ Architecture

### Client-Server Model

- **Client**: React Native (Expo) mobile app
- **Server**: Node.js with Express and Socket.io
- **Communication**: Real-time WebSocket connections
- **Network**: Local WiFi/LAN connectivity

### Game Flow

1. **Lobby Phase**: Players join via host's IP address
2. **Setup Phase**: Host configures roles and timers
3. **Role Assignment**: Secret roles distributed to players
4. **Game Loop**:
   - Night Phase: Special roles act (kill, heal, investigate)
   - Discussion Phase: Players discuss and share suspicions
   - Voting Phase: Eliminate suspected mafia members
   - Results Phase: Reveal outcomes and check win conditions

## 📱 Technical Implementation

### Client Features

- Cross-platform mobile app (iOS/Android)
- Responsive dark-themed UI
- Real-time game state synchronization
- Role-specific interface elements
- Timer displays and phase transitions
- QR code scanning for easy joining

### Server Features

- Lightweight Node.js server
- WebSocket real-time communication
- Game state management
- Role assignment algorithms
- Action processing and validation
- Win condition detection
- Host migration handling

## 🎯 Target Audience

- **Primary**: Friend groups, families, party hosts
- **Secondary**: Gaming communities, team building events
- **Use Cases**:
  - House parties and gatherings
  - Corporate team building
  - Gaming meetups
  - Educational social dynamics workshops

## 🔧 Development Status

This project provides a complete, playable implementation of the Mafia game optimized for local network gameplay, making it perfect for in-person social gatherings without requiring internet connectivity.
