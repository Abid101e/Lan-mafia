/\*\*

- COMPLETE GAME LOGIC FLOW - LAN MAFIA
- ===================================
-
- This document outlines the complete game cycle with win conditions
- and continuous gameplay until one party achieves victory.
  \*/

## GAME PHASES AND LOGIC

### 1. GAME SETUP

- Players join lobby
- Host configures settings (roles, timers)
- Minimum 3 players required
- Roles assigned randomly: Killer, Healer, Police, Townspeople

### 2. NIGHT PHASE

**Actions:**

- Killer: Choose player to eliminate
- Healer: Choose player to protect (can save someone from killer)
- Police: Investigate player (learn if they're suspicious/innocent)
- Townspeople: Wait for phase to end

**Processing:**

- All actions collected
- Heals processed first (prevent deaths)
- Kills processed (unless healed)
- Investigations completed
- Results calculated

**Navigation:** Night → Discussion

### 3. DISCUSSION PHASE

**Actions:**

- Players discuss night events
- Police shares investigation results (optional)
- Players identify suspicious behavior
- All players must ready up to proceed

**Information Shared:**

- Who (if anyone) was eliminated during night
- General investigation occurred (not specific results)
- Player can share their findings

**Navigation:** Discussion → Voting (when all ready)

### 4. VOTING PHASE

**Actions:**

- Each player votes to eliminate one suspect
- Timer-based or all votes submitted
- Cannot vote for themselves
- Cannot vote for dead players

**Processing:**

- Count all votes
- Player with most votes is eliminated
- Ties result in no elimination
- Role revealed on elimination

**Navigation:** Voting → Results

### 5. RESULTS PHASE

**Display:**

- Who was voted out and their role
- Round summary
- Current alive players

**Win Condition Check:**

- **Town Wins**: All killers eliminated
- **Mafia Wins**: Killers ≥ Townspeople
- **Continue**: If no win condition met

**Navigation:**

- If win condition met → Win Screen
- If game continues → Night Phase (new cycle)

### 6. WIN SCREEN

**Display:**

- Winner announcement (Town or Mafia)
- Win reason
- Final player states and roles
- Play again option

## WIN CONDITIONS

### Town Victory

```
aliveKillers.length === 0
Reason: "All killers have been eliminated!"
```

### Mafia Victory

```
aliveKillers.length >= aliveTownspeople.length
Reason: "The killers have taken control of the town!"
```

### Game Continues

```
aliveKillers.length > 0 && aliveKillers.length < aliveTownspeople.length
```

## CONTINUOUS CYCLE

The game continues in this loop until win condition:

```
Night → Discussion → Voting → Results → [Win Check]
  ↑                                         ↓
  ←←←←←←←←←←← [Continue] ←←←←←←←←←←←←←←←←←←←←←←
                     ↓
                 [Win Screen]
```

## ROLE ABILITIES

### Killer (Mafia)

- **Night Action**: Choose one player to eliminate
- **Goal**: Reduce town to equal or fewer than killers
- **Strategy**: Eliminate threats (police, healer) and blend in during discussion

### Healer

- **Night Action**: Choose one player to protect from death
- **Goal**: Keep townspeople alive and identify killers
- **Strategy**: Protect key players and suspicious targets

### Police

- **Night Action**: Investigate one player to learn their alignment
- **Goal**: Identify killers and share information
- **Strategy**: Investigate suspicious players and guide voting

### Townspeople

- **Night Action**: None (wait)
- **Goal**: Identify and vote out all killers
- **Strategy**: Listen to discussions and vote based on behavior

## IMPLEMENTATION STATUS

✅ **Completed:**

- Complete phase cycle (Night → Discussion → Voting → Results)
- All role actions (Kill, Heal, Investigate)
- Win condition checking
- Player elimination mechanics
- Automatic phase transitions
- Continuous game cycle until win

✅ **Game Flow:**

- Night actions processing with heal precedence
- Discussion with ready system
- Voting with majority elimination
- Results display with role reveal
- Win detection and game end
- Proper navigation between phases

✅ **Win Conditions:**

- Town wins when all killers eliminated
- Mafia wins when killers ≥ townspeople
- Game continues until one condition met

The game is now complete with full logic implementation!
