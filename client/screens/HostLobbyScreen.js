import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
} from "react-native";
import { socket } from "../utils/socket";
import PlayerCard from "../components/PlayerCard";

// Cache dimensions
const screenDimensions = Dimensions.get("window");
const { width } = screenDimensions;

export default React.memo(function HostLobbyScreen({ navigation, route }) {
  const [hostName, setHostName] = useState("");
  const [players, setPlayers] = useState([]);

  // Add debugging to track players state changes
  useEffect(() => {
    console.log(
      "🔄 Players state changed in lobby:",
      players.length,
      players.map((p) => p.name)
    );
  }, [players]);

  const [gameCode, setGameCode] = useState(route?.params?.gameCode || "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [gameCreated, setGameCreated] = useState(!!route?.params?.gameCode); // If gameCode exists, game is already created
  const [isHost, setIsHost] = useState(route?.params?.isHost !== false); // Default to true unless explicitly false
  const [isReady, setIsReady] = useState(false); // Ready status for non-host players
  const [readyPlayers, setReadyPlayers] = useState([]); // Track which players are ready

  console.log("HostLobbyScreen mounted with params:", route?.params);
  console.log(
    "isHost:",
    isHost,
    "gameCreated:",
    gameCreated,
    "gameCode:",
    gameCode
  );

  useEffect(() => {
    console.log("Setting up HostLobbyScreen component");
    console.log("Socket state:", {
      socketExists: !!socket.socket,
      isConnected: socket.socket?.connected,
      socketId: socket.socket?.id,
    });

    // If this is a joined player (gameCode exists), set up listeners immediately
    if (gameCode && socket.socket) {
      console.log("Joined player - setting up socket listeners immediately");
      setupSocketListeners();

      // Request current players list
      console.log("Requesting current players for game:", gameCode);
      socket.socket.emit("getPlayers", { gameCode });
    }

    // Set up connection monitoring
    const connectionMonitor = setInterval(() => {
      if (socket.socket) {
        console.log("Connection status:", {
          connected: socket.socket.connected,
          socketId: socket.socket.id,
          playersCount: players.length,
        });
      }
    }, 5000); // Check every 5 seconds

    return () => {
      // Clean up when component unmounts
      clearInterval(connectionMonitor);
      if (socket.socket) {
        socket.socket.off("gameCreated");
        socket.socket.off("playersUpdated");
        socket.socket.off("playerJoined");
        socket.socket.off("error");
        socket.socket.off("playersResponse");
        socket.socket.off("readyStatusUpdated");
        socket.socket.off("gameStarted");
      }
    };
  }, [hostName]);

  const handleToggleReady = () => {
    const newReadyStatus = !isReady;
    setIsReady(newReadyStatus);

    socket.emit("setReadyStatus", {
      gameCode,
      isReady: newReadyStatus,
    });

    console.log("Ready status changed to:", newReadyStatus);
  };

  const areAllPlayersReady = () => {
    const nonHostPlayers = players.filter((p) => !p.isHost);
    return (
      nonHostPlayers.length > 0 &&
      nonHostPlayers.every((p) => readyPlayers.includes(p.id))
    );
  };

  const setupSocketListeners = () => {
    if (!socket.socket) {
      console.log("Cannot setup listeners - no socket");
      return;
    }

    console.log("Setting up fresh socket listeners...");

    // Clean up any existing listeners
    socket.socket.off("gameCreated");
    socket.socket.off("playersUpdated");
    socket.socket.off("playerJoined");
    socket.socket.off("error");
    socket.socket.off("playersResponse");
    socket.socket.off("readyStatusUpdated");
    socket.socket.off("gameStarted");

    // Set up fresh event listeners
    socket.socket.on("gameCreated", (data) => {
      console.log("Game created event received:", data);
      setGameCode(data.gameCode);
      setGameCreated(true);
      setIsConnecting(false);
      setPlayers([{ id: data.hostId, name: hostName, isHost: true }]);
    });

    socket.socket.on("playersUpdated", (players) => {
      console.log("📥 LOBBY: Players updated event received:", players);
      console.log("📊 LOBBY: Players count:", players ? players.length : 0);
      console.log(
        "📊 LOBBY: Current players state before update:",
        players.length
      );
      setPlayers(players);
      console.log("📊 LOBBY: After setPlayers called");

      // Force a re-render check
      setTimeout(() => {
        console.log(
          "📊 LOBBY: Players state 100ms after setPlayers:",
          players.length
        );
      }, 100);
    });

    socket.socket.on("playersResponse", (players) => {
      console.log("Players response event received:", players);
      setPlayers(players);
    });

    socket.socket.on("readyStatusUpdated", (data) => {
      console.log("Ready status updated:", data);
      setReadyPlayers(data.readyPlayers);
    });

    socket.socket.on("gameStarted", (data) => {
      console.log("🎮 Game started event received:", data);
      navigation.navigate("NightPhase");
    });

    socket.socket.on("playerJoined", (player) => {
      console.log("Player joined event received:", player);
      Alert.alert("Player Joined", `${player.name} joined the game!`);
    });

    socket.socket.on("error", (error) => {
      console.log("Error event received:", error);
      setIsConnecting(false);
      Alert.alert("Error", error.message);
    });

    console.log("Socket listeners setup completed");
  };
  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsConnecting(true);

    try {
      // Try multiple IP addresses for connection
      const possibleIPs = [
        "192.168.54.91", // PPP connection
        "10.220.54.130", // Ethernet connection
        "localhost", // Fallback for simulator
        "127.0.0.1", // Another localhost fallback
      ];

      let connected = false;
      let lastError = null;

      for (const ip of possibleIPs) {
        if (connected) break;

        try {
          console.log(`Attempting to connect to ${ip}...`);
          socket.connect(ip);

          // Wait for connection to be established with shorter timeout per attempt
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Connection timeout to ${ip}`));
            }, 3000); // Reduced timeout per IP

            const handleConnect = () => {
              clearTimeout(timeout);
              console.log(`Successfully connected to ${ip}!`);
              setupSocketListeners();
              connected = true;
              resolve();
            };

            const handleError = (error) => {
              clearTimeout(timeout);
              reject(error);
            };

            socket.socket.on("connect", handleConnect);
            socket.socket.on("connect_error", handleError);
          });
        } catch (error) {
          console.log(`Failed to connect to ${ip}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!connected) {
        throw lastError || new Error("Could not connect to any server address");
      }

      // Now emit the hostGame event directly on the socket instance
      socket.socket.emit("hostGame", {
        playerName: hostName.trim(),
        maxPlayers: 8, // Default max players
      });

      // The gameCreated event will be handled by the listener we just set up
      console.log("Game creation request sent, waiting for response...");
    } catch (error) {
      console.error("Failed to create game:", error);
      Alert.alert(
        "Connection Error",
        `Could not connect to game server: ${error.message}`
      );
      setIsConnecting(false);
    }
  };

  const handleStartGame = () => {
    if (players.length < 3) {
      Alert.alert("Not Enough Players", "Need at least 3 players to start");
      return;
    }

    if (!areAllPlayersReady()) {
      Alert.alert(
        "Players Not Ready",
        "All players must be ready before starting the game"
      );
      return;
    }

    socket.emit("startGame");
    navigation.navigate("HostSettings");
  };

  const handleKickPlayer = (playerId) => {
    Alert.alert("Kick Player", "Are you sure you want to kick this player?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Kick",
        style: "destructive",
        onPress: () => socket.emit("kickPlayer", { playerId }),
      },
    ]);
  };

  const renderPlayer = ({ item }) => (
    <PlayerCard
      player={item}
      isHost={isHost}
      showReadyStatus={true}
      isReady={readyPlayers.includes(item.id)}
      onKick={item.isHost ? null : () => handleKickPlayer(item.id)}
    />
  );

  // Show setup screen only if game is not created AND not a joined player
  if (!gameCreated && !route?.params?.gameCode) {
    console.log("Rendering setup screen - gameCreated is:", gameCreated);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Host Game</Text>
        </View>

        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>🎯 Create Your Game</Text>
          <Text style={styles.setupSubtitle}>
            Set up a new Mafia game for your friends
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Your Name (Host)</Text>
            <TextInput
              style={styles.input}
              value={hostName}
              onChangeText={setHostName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              maxLength={20}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, isConnecting && styles.buttonDisabled]}
            onPress={handleCreateGame}
            disabled={isConnecting}
          >
            <Text style={styles.createButtonText}>
              {isConnecting ? "🔄 Creating Game..." : "🚀 Create Game"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  console.log("Rendering lobby screen - gameCreated is:", gameCreated);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Lobby</Text>
        {isHost && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("HostSettings")}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gameInfo}>
        <Text style={styles.gameCodeLabel}>Game Code</Text>
        <Text style={styles.gameCodeText}>#{gameCode}</Text>
        <Text style={styles.gameCodeSubtext}>
          Players can use this code to join
        </Text>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.playersTitle}>👥 Players ({players.length}/8)</Text>
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        />
      </View>

      <View style={styles.hostControls}>
        {isHost && (
          <>
            <TouchableOpacity
              style={styles.settingsButtonLarge}
              onPress={() => navigation.navigate("HostSettings")}
            >
              <Text style={styles.settingsButtonLargeText}>
                ⚙️ Game Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                (players.length < 3 || !areAllPlayersReady()) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={players.length < 3 || !areAllPlayersReady()}
            >
              <Text style={styles.startButtonText}>
                {players.length < 3
                  ? `Need ${3 - players.length} more players`
                  : !areAllPlayersReady()
                  ? "Waiting for all players to be ready"
                  : "🎮 Start Game"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {!isHost && (
          <TouchableOpacity
            style={[styles.readyButton, isReady && styles.readyButtonActive]}
            onPress={handleToggleReady}
          >
            <Text
              style={[
                styles.readyButtonText,
                isReady && styles.readyButtonTextActive,
              ]}
            >
              {isReady ? "✅ Ready" : "⏳ Not Ready"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: {
    marginRight: 20,
  },
  backText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  setupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  setupSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 40,
  },
  inputSection: {
    width: "100%",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#404040",
  },
  createButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: "100%",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  gameInfo: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#404040",
  },
  gameCodeLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 5,
  },
  gameCodeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  gameCodeSubtext: {
    fontSize: 12,
    color: "#666",
  },
  playersSection: {
    flex: 1,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  hostControls: {
    marginTop: 20,
    gap: 10,
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  settingsButtonText: {
    fontSize: 18,
    color: "#4CAF50",
  },
  settingsButtonLarge: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#66BB6A",
  },
  settingsButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 15,
    borderRadius: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  readyButton: {
    backgroundColor: "#333",
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#666",
  },
  readyButtonActive: {
    backgroundColor: "#00ff88",
    borderColor: "#00cc66",
  },
  readyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  readyButtonTextActive: {
    color: "#000",
  },
});
