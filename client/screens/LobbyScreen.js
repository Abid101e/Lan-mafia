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
} from "react-native";
import { socket } from "../utils/socket";
import PlayerCard from "../components/PlayerCard";

const { width } = Dimensions.get("window");

export default function LobbyScreen({ navigation, route }) {
  console.log("LobbyScreen mounted with route params:", route?.params);

  const [playerName, setPlayerName] = useState("");
  const [hostIP, setHostIP] = useState("10.220.54.130");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(route?.params?.isHost || false);
  const [gameCode, setGameCode] = useState(route?.params?.gameCode || "");
  const [isConnecting, setIsConnecting] = useState(false);

  console.log("LobbyScreen state - isHost:", isHost, "gameCode:", gameCode);

  useEffect(() => {
    // If coming from HomeScreen as host, show different UI
    if (route?.params?.isHost) {
      setIsHost(true);
    }
  }, [route]);

  useEffect(() => {
    socket.on("playersUpdated", setPlayers);
    socket.on("gameStarted", () => navigation.navigate("RoleReveal"));
    socket.on("gameCode", setGameCode);
    socket.on("connected", () => setIsConnecting(false));
    socket.on("error", (error) => {
      setIsConnecting(false);
      Alert.alert("Connection Error", error.message);
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("gameStarted");
      socket.off("gameCode");
      socket.off("connected");
      socket.off("error");
    };
  }, []);

  const handleHostGame = () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    setIsHost(true);

    // Connect to local server first
    setIsConnecting(true);
    socket.connect("localhost"); // Connect to local server
    socket.emit("hostGame", { playerName: playerName.trim() });
    navigation.navigate("HostSettings");
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!hostIP.trim()) {
      Alert.alert("Error", "Please enter host IP address");
      return;
    }

    setIsConnecting(true);
    socket.connect(hostIP.trim());
    socket.emit("joinGame", { playerName: playerName.trim() });
  };

  const renderPlayer = ({ item, index }) => (
    <PlayerCard player={item} index={index} style={styles.playerCard} />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🎭 LAN Mafia</Text>

      {gameCode && (
        <View style={styles.gameCodeContainer}>
          <Text style={styles.gameCodeLabel}>Game Code:</Text>
          <Text style={styles.gameCode}>{gameCode}</Text>
        </View>
      )}

      {/* Only show setup form if no gameCode (meaning not in a game yet) */}
      {!gameCode && (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#666"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={20}
            />

            {!isHost && (
              <TextInput
                style={styles.input}
                placeholder="Host IP Address (e.g., 192.168.1.100)"
                placeholderTextColor="#666"
                value={hostIP}
                onChangeText={setHostIP}
                keyboardType="numeric"
              />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.hostButton]}
              onPress={handleHostGame}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>🎯 Host Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={handleJoinGame}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>
                {isConnecting ? "Connecting..." : "🔗 Join Game"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {players.length > 0 && (
        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>Players ({players.length})</Text>
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {isHost && players.length >= 4 && (
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={() => navigation.navigate("HostSettings")}
        >
          <Text style={styles.buttonText}>⚡ Configure & Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  backButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  gameCodeContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  gameCodeLabel: {
    color: "#ccc",
    fontSize: 14,
  },
  gameCode: {
    color: "#00ff88",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  hostButton: {
    backgroundColor: "#ff6b6b",
  },
  joinButton: {
    backgroundColor: "#4ecdc4",
  },
  startButton: {
    backgroundColor: "#feca57",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  playersSection: {
    flex: 1,
  },
  playersTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    marginBottom: 10,
  },
});
