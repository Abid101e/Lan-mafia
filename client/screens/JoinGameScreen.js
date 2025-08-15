import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";
import { socket } from "../utils/socket";

const { width } = Dimensions.get("window");

export default function JoinGameScreen({ navigation }) {
  const [playerName, setPlayerName] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Scan for available games when screen loads
    scanForGames();

    // Set up socket listeners
    socket.on("gameListUpdated", (games) => {
      console.log("Received games list:", games);
      setAvailableGames(games);
      setIsScanning(false);
      setIsRefreshing(false);
    });

    socket.on("joinedGame", (gameData) => {
      console.log("Old joinedGame listener triggered - this should not happen");
      // This listener is now handled in handleJoinGame function
    });

    socket.on("joinError", (error) => {
      Alert.alert("Join Error", error.message);
    });

    return () => {
      socket.off("gameListUpdated");
      socket.off("joinedGame");
      socket.off("joinError");
    };
  }, []);

  const scanForGames = () => {
    setIsScanning(true);
    // Use the new discovery system
    socket.scanForGames();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    scanForGames();
  };

  const handleJoinGame = async (game) => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Please enter your name first");
      return;
    }

    try {
      // Connect to the game host
      socket.connect(game.hostIP);

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 5000);

        const handleConnect = () => {
          clearTimeout(timeout);
          console.log("Connected to host, now joining game...");

          // Set up listener for join response
          socket.socket.on("joinedGame", (gameData) => {
            console.log("Successfully joined game:", gameData);
            console.log("About to navigate to Lobby with params:", {
              isHost: false,
              gameCode: gameData.gameCode,
              playerId: gameData.playerId,
            });

            // Navigate to the same lobby screen as the host
            try {
              navigation.navigate("HostLobby", {
                isHost: false,
                gameCode: gameData.gameCode,
                playerId: gameData.playerId,
                hostName: "", // Will be populated from server data
              });
              console.log("Navigation called successfully");
            } catch (error) {
              console.error("Navigation error:", error);
            }
          });

          socket.socket.on("error", (error) => {
            console.error("Join game error:", error);
            Alert.alert("Error", error.message || "Failed to join game");
          });

          resolve();
        };

        socket.socket.on("connect", handleConnect);

        socket.socket.on("connect_error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Now join the game using the established connection
      socket.socket.emit("joinGameByCode", {
        gameCode: game.gameCode,
        playerName: playerName.trim(),
      });

      console.log(`Sent join request for game ${game.gameCode}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      Alert.alert("Connection Error", "Could not connect to the game host.");
    }
  };

  const renderGameItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleJoinGame(item)}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameName}>{item.hostName}'s Game</Text>
        <Text style={styles.gameCode}>#{item.gameCode}</Text>
      </View>
      <View style={styles.gameInfo}>
        <Text style={styles.playerCount}>
          👥 {item.playerCount}/{item.maxPlayers} players
        </Text>
        <Text style={styles.gameStatus}>
          {item.status === "waiting"
            ? "🟢 Waiting for players"
            : "🔴 In progress"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Join Game</Text>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.nameInput}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          maxLength={20}
        />
      </View>

      <View style={styles.gamesSection}>
        <View style={styles.gamesSectionHeader}>
          <Text style={styles.gamesTitle}>Available Games</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {isScanning ? (
          <View style={styles.centerContainer}>
            <Text style={styles.scanningText}>🔍 Scanning for games...</Text>
          </View>
        ) : availableGames.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noGamesText}>😔 No games available</Text>
            <Text style={styles.noGamesSubtext}>
              Ask someone to host a game first
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={availableGames}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.gameCode}
            style={styles.gamesList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

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
  nameSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#404040",
  },
  gamesSection: {
    flex: 1,
  },
  gamesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  gamesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningText: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
  },
  noGamesText: {
    fontSize: 20,
    color: "#999",
    textAlign: "center",
    marginBottom: 10,
  },
  noGamesSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  gamesList: {
    flex: 1,
  },
  gameCard: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#404040",
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  gameCode: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  gameInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playerCount: {
    fontSize: 14,
    color: "#999",
  },
  gameStatus: {
    fontSize: 14,
    color: "#999",
  },
});
