# Game Flow Documentation

## 🎮 Complete Game Flow for LAN Mafia

### Phase 1: Lobby & Setup

**Duration**: Variable (until host starts game)
**Participants**: All players

#### Player Actions:

- Enter player name
- Connect to host's IP address
- Wait for other players to join
- View connected players list

#### Host Actions:

- Start host server (auto-generates IP)
- Configure game settings:
  - Total players (4-20)
  - Role distribution (killers, healers, police, townspeople)
  - Phase timers (night, discussion, voting)
  - Special rules
- Start game when ready

#### Transitions:

- Host clicks "Start Game" → **Role Assignment**

---

### Phase 2: Role Assignment

**Duration**: 10 seconds (configurable)
**Participants**: All players

#### Player Actions:

- View assigned role secretly
- Read role description and abilities
- Understand win condition
- Confirm readiness

#### System Actions:

- Randomly assign roles based on host settings
- Send private role info to each player
- Display role reveal interface
- Start countdown timer

#### Transitions:

- Timer expires → **Night Phase**

---

### Phase 3: Night Phase

**Duration**: 30 seconds (configurable)
**Participants**: Players with special roles

#### Active Roles & Actions:

**🔪 Killers (Mafia)**:

- Select target player to eliminate
- Coordinate with other killers (if multiple)
- Submit kill action

**💚 Healers (Doctors)**:

- Select player to protect from elimination
- Cannot heal themselves (configurable)
- Submit heal action

**👮 Police (Detectives)**:

- Select player to investigate
- Learn if target is "suspicious" (killer) or "innocent"
- Submit investigate action

**👤 Townspeople**:

- Wait and observe (no actions available)
- Screen shows "Sleep tight..." message

#### System Processing:

1. Collect all night actions
2. Process in order: Heals → Kills → Investigations
3. Determine final outcomes
4. Prepare results for morning

#### Transitions:

- All actions submitted OR timer expires → **Discussion Phase**

---

### Phase 4: Discussion Phase

**Duration**: 120 seconds (configurable)
**Participants**: All living players

#### Player Actions:

- Discuss night events and suspicions
- Share information (truthfully or deceptively)
- Form alliances and accusations
- Strategy and social deduction

#### Information Available:

- Who was eliminated during the night
- General night event summary
- Current living players list
- Previous day's voting results

#### Police Information:

- Privately receive investigation results
- Can choose to share or keep secret

#### Transitions:

- Timer expires → **Voting Phase**

---

### Phase 5: Voting Phase

**Duration**: 60 seconds (configurable)
**Participants**: All living players

#### Player Actions:

- Review all living players
- Select one player to eliminate
- Submit vote (one vote per player)
- Cannot vote for themselves

#### Voting Rules:

- Majority vote eliminates player
- Ties result in no elimination
- No vote = abstention

#### System Processing:

1. Count all votes
2. Determine player with most votes
3. Handle tie scenarios
4. Eliminate selected player (if any)

#### Transitions:

- All votes submitted OR timer expires → **Results Phase**

---

### Phase 6: Results Phase

**Duration**: 5 seconds (auto-advance)
**Participants**: All players

#### Information Displayed:

- Night phase results:
  - Who was killed
  - Who was saved (general message)
  - Investigation results (to police only)
- Voting results:
  - Vote counts for each player
  - Who was eliminated by vote
  - Player's revealed role (if eliminated)

#### System Actions:

- Check win conditions
- Update player status (alive/dead)
- Prepare for next round

#### Transitions:

- **If game continues** → **Night Phase** (next round)
- **If win condition met** → **Game Over**

---

### Phase 7: Game Over

**Duration**: Until host restarts
**Participants**: All players

#### Win Conditions:

**🏆 Mafia Victory**:

- Killers equal or outnumber townspeople
- All special town roles eliminated

**🏆 Town Victory**:

- All killers eliminated
- Town maintains majority

#### Information Displayed:

- Winner announcement
- Final player list with roles
- Game statistics and summary
- Option to return to lobby

#### Host Actions:

- View complete game results
- Start new game with same players
- Return to lobby for new setup

#### Transitions:

- Host starts new game → **Role Assignment**
- Return to lobby → **Lobby & Setup**

---

## 🔄 Special Scenarios

### Player Disconnection:

- **During Game**: Player marked as disconnected but remains in game
- **Host Disconnection**: Game ends, all players return to lobby
- **Reconnection**: Player can rejoin if game still active

### Timer Expiration:

- **Night Phase**: Unsubmitted actions treated as "no action"
- **Discussion**: Automatically advances to voting
- **Voting**: Uncast votes treated as abstentions

### Tie Situations:

- **Voting Ties**: No elimination occurs
- **Investigation**: Police get clear "suspicious/innocent" result
- **Multiple Kills**: All targets eliminated unless healed

### Edge Cases:

- **Last Killer Vote**: If last killer is voted out, town wins immediately
- **Simultaneous Win**: Town victory takes precedence
- **All Abstain**: No elimination, game continues

---

## 📊 Game Balance Considerations

### Recommended Role Distributions:

- **4 players**: 1K, 1H, 0P, 2T
- **6 players**: 2K, 1H, 1P, 2T
- **8 players**: 2K, 1H, 1P, 4T
- **10 players**: 3K, 1H, 1P, 5T
- **12+ players**: Scale proportionally

### Timer Recommendations:

- **Night Phase**: 30-45 seconds
- **Discussion**: 90-180 seconds
- **Voting**: 45-90 seconds
- **Role Reveal**: 10-15 seconds
