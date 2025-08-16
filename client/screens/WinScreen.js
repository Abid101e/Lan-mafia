/**
 * Win Screen Component - Game over screen with winner announcement
 */
/**
 * Displays game over screen.
 * Announces winning team (civilians or killers).
 * Includes restart or exit options for host and players.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
} from "react-native";
import { socket } from "../utils/socket";

const { width } = Dimensions.get("window");

export default function WinScreen({ navigation }) {
  const [gameResult, setGameResult] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [celebrateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log("🏁 WinScreen mounted, setting up listeners");

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(celebrateAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Request game result when screen mounts (in case event was missed)
    console.log("🏁 Requesting game result...");
    setTimeout(() => {
      socket.emit("getGameResult");
    }, 100);

    socket.on("gameOver", (result) => {
      console.log("🏁 WinScreen received gameOver:", result);
      setGameResult(result);
    });

    socket.on("gameReset", () => {
      console.log("🔄 Game reset received, returning to lobby");
      navigation.navigate("HostLobby");
    });

    return () => {
      socket.off("gameOver");
      socket.off("gameReset");
    };
  }, [navigation]);

  const returnToLobby = () => {
    socket.emit("leaveGame");
    navigation.navigate("Home");
  };

  const restartGame = () => {
    socket.emit("restartGame");
  };

  if (!gameResult) {
    console.log("🏁 WinScreen: No game result yet, showing loading...");
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🏁 Determining winner...</Text>
          <Text style={styles.subText}>
            Please wait while we calculate the final results
          </Text>
        </View>
      </Animated.View>
    );
  }

  console.log("🏁 WinScreen: Displaying game result:", gameResult);

  const renderPlayer = ({ item }) => (
    <View style={[styles.playerItem, !item.isAlive && styles.deadPlayer]}>
      <Text style={styles.playerName}>{item.name}</Text>
      <Text style={styles.playerRole}>{item.role}</Text>
      <Text style={styles.playerStatus}>
        {item.isAlive ? "🟢 Survived" : "💀 Eliminated"}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.winnerContainer,
          { transform: [{ scale: celebrateAnim }] },
        ]}
      >
        <Text style={styles.gameOverTitle}>🎮 Game Over!</Text>

        <View
          style={[
            styles.resultContainer,
            gameResult.winner === "mafia" ? styles.mafiaWin : styles.townWin,
          ]}
        >
          <Text style={styles.winnerTitle}>
            {gameResult.winner === "mafia"
              ? "🔪 Mafia Victory!"
              : "👥 Town Victory!"}
          </Text>

          <Text style={styles.winReason}>{gameResult.reason}</Text>
        </View>
      </Animated.View>

      <View style={styles.playersSection}>
        <Text style={styles.playersTitle}>📋 Final Game State:</Text>
        <FlatList
          data={gameResult.players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.restartButton]}
          onPress={restartGame}
        >
          <Text style={styles.buttonText}>🔄 Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.lobbyButton]}
          onPress={returnToLobby}
        >
          <Text style={styles.buttonText}>🏠 Return to Home</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
  },
  winnerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  resultContainer: {
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mafiaWin: {
    backgroundColor: "#e74c3c",
  },
  townWin: {
    backgroundColor: "#27ae60",
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
  },
  winReason: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },
  playersSection: {
    flex: 1,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    backgroundColor: "#2c3e50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deadPlayer: {
    backgroundColor: "#34495e",
    opacity: 0.7,
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  playerRole: {
    color: "#f39c12",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
  },
  playerStatus: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  restartButton: {
    backgroundColor: "#f39c12",
  },
  lobbyButton: {
    backgroundColor: "#3498db",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
