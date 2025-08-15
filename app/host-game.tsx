import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GameState, Player } from "../types/game";
import { getLocalIPAddress, getSocketURL } from "../utils/networkUtils";
import { socketManager } from "../utils/socketManager";

export default function HostGameScreen() {
  const { playerName, localIP } = useLocalSearchParams<{
    playerName: string;
    localIP: string;
  }>();
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [hostIP, setHostIP] = useState(localIP || "192.168.43.1");
  const [settings, setSettings] = useState({
    killers: 2,
    healers: 1,
    police: 1,
    totalPlayers: 8,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Get actual IP address
    getLocalIPAddress().then((ip) => {
      if (ip) {
        setHostIP(ip);
        const url = getSocketURL(ip, 3000);
        setServerUrl(url);
      }
    });

    // Pulse animation for waiting status
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  const animateButtonPress = (isPressed: boolean) => {
    Animated.spring(buttonScale, {
      toValue: isPressed ? 0.95 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const startServer = async () => {
    if (!playerName || !hostIP) {
      Alert.alert("Error", "Missing player name or IP address");
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to the server
      await socketManager.connect(serverUrl);

      // Join the game as host
      socketManager.joinGame(playerName);

      // Set up event listeners
      socketManager.on("gameStateUpdated", (state: GameState) => {
        console.log("Game state updated:", state);
        setGameState(state);
      });

      socketManager.on("playerJoined", (player: Player) => {
        console.log("Player joined:", player);
        Alert.alert(
          "OPERATIVE CONNECTED",
          `${player.name} has joined the operation!\n\nTotal operatives: ${
            (gameState?.players.length || 0) + 1
          }`
        );
      });

      socketManager.on("playerLeft", (playerId: string) => {
        console.log("Player left:", playerId);
        Alert.alert(
          "OPERATIVE DISCONNECTED",
          "An operative has left the mission"
        );
      });

      socketManager.on("error", (message: string) => {
        Alert.alert("Connection Error", message);
      });

      setIsServerRunning(true);
      Alert.alert(
        "🚀 OPERATION SERVER ACTIVE",
        `Mission command center is online!\n\nNetwork: ${hostIP}:3000\n\n📡 DEPLOYMENT STATUS:\n✅ Server initialized\n✅ Network established\n🔄 Awaiting operatives...`
      );
    } catch (error: any) {
      console.error("Server start error:", error);
      Alert.alert(
        "🚨 DEPLOYMENT FAILED",
        "Unable to initialize operation server.\n\n🔧 TROUBLESHOOT:\n• Ensure mobile hotspot is active\n• Verify network connectivity\n• Check firewall settings\n• Restart the application"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const startGame = () => {
    if (!gameState || gameState.players.length < 4) {
      Alert.alert(
        "Insufficient Operatives",
        "Mission requires minimum 4 agents to commence."
      );
      return;
    }

    socketManager.startGame();
  };

  const stopServer = () => {
    socketManager.disconnect();
    setIsServerRunning(false);
    setGameState(null);
    router.back();
  };

  const shareRoomDetails = async () => {
    try {
      await Share.share({
        message: `🎭 Join my Mafia Operation!\n\n🌐 Server: ${hostIP}\n👑 Commander: ${playerName}\n\n📱 Download LAN Mafia and connect using this address.`,
        title: "Join Mafia Mission",
      });
    } catch (error: any) {
      console.error("Share error:", error);
      Alert.alert("Share Failed", "Could not share mission details.");
    }
  };

  const kickPlayer = (playerId: string) => {
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
      };
    });
    if (socketManager.isConnected()) {
      console.log("Removing operative:", playerId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Background overlay */}
      <View style={styles.backgroundOverlay} />

      <Animated.ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>🎭 OPERATION COMMAND</Text>
          <Text style={styles.subtitle}>Mission Control • {playerName}</Text>
        </Animated.View>

        {!isServerRunning ? (
          // Server Setup View
          <Animated.View
            style={[
              styles.setupCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.networkInfo}>
              <Text style={styles.cardTitle}>🌐 NETWORK CONFIGURATION</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>HOST IP:</Text>
                <Text style={styles.infoValue}>{hostIP}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PORT:</Text>
                <Text style={styles.infoValue}>3000</Text>
              </View>
            </View>

            <View style={styles.instructionsCard}>
              <Text style={styles.cardTitle}>📋 DEPLOYMENT PROTOCOL</Text>
              <Text style={styles.instructionStep}>
                1. 📶 Activate mobile hotspot
              </Text>
              <Text style={styles.instructionStep}>
                2. 🔐 Share network credentials with operatives
              </Text>
              <Text style={styles.instructionStep}>
                3. 🤝 Ensure all devices connect to your network
              </Text>
              <Text style={styles.instructionStep}>
                4. 🚀 Initialize secure server connection
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.initializeButton,
                isConnecting && styles.disabledButton,
              ]}
              onPress={startServer}
              onPressIn={() => animateButtonPress(true)}
              onPressOut={() => animateButtonPress(false)}
              disabled={isConnecting}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.buttonContent,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                {isConnecting ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>INITIALIZING...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>🚀</Text>
                    <Text style={styles.buttonText}>INITIALIZE SERVER</Text>
                    <Text style={styles.buttonSubtext}>
                      Deploy operation network
                    </Text>
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          // Server Running View
          <Animated.View
            style={[
              styles.gameContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Server Status */}
            <View style={styles.statusCard}>
              <Animated.View
                style={[
                  styles.statusIndicator,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.statusDot}>🟢</Text>
              </Animated.View>
              <Text style={styles.statusText}>SERVER ACTIVE</Text>
              <Text style={styles.statusSubtext}>Awaiting operatives...</Text>
            </View>

            {/* Network Info */}
            <View style={styles.networkCard}>
              <Text style={styles.cardTitle}>🌐 CONNECTION DETAILS</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SERVER:</Text>
                <Text style={styles.infoValue}>{hostIP}:3000</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>OPERATIVES:</Text>
                <Text style={styles.infoValue}>
                  {gameState?.players.length || 1}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareRoomDetails}
                activeOpacity={0.7}
              >
                <Text style={styles.shareButtonText}>📤 SHARE MISSION</Text>
              </TouchableOpacity>
            </View>

            {/* Players List */}
            <View style={styles.playersCard}>
              <Text style={styles.cardTitle}>👥 CONNECTED OPERATIVES</Text>
              {gameState?.players && gameState.players.length > 0 ? (
                gameState.players.map((player) => (
                  <Animated.View
                    key={player.id}
                    style={[
                      styles.playerCard,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                      },
                    ]}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.isHost ? "👑" : "🕵️"} {player.name}
                      </Text>
                      <Text style={styles.playerRole}>
                        {player.isHost ? "COMMANDER" : "OPERATIVE"}
                      </Text>
                    </View>
                    {!player.isHost && (
                      <TouchableOpacity
                        style={styles.kickButton}
                        onPress={() => kickPlayer(player.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.kickButtonText}>🚫</Text>
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                ))
              ) : (
                <Text style={styles.noPlayersText}>
                  Waiting for operatives to join...
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  (!gameState || gameState.players.length < 4) &&
                    styles.disabledButton,
                ]}
                onPress={startGame}
                disabled={!gameState || gameState.players.length < 4}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>
                  🎭 COMMENCE OPERATION
                </Text>
                <Text style={styles.buttonSubtext}>
                  {gameState?.players.length || 0}/8 operatives ready
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopServer}
                activeOpacity={0.7}
              >
                <Text style={styles.stopButtonText}>🛑 ABORT MISSION</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>OPERATION SETTINGS</Text>
            <Text style={styles.label}>Mafia Agents:</Text>
            <TextInput
              style={styles.input}
              value={settings.killers.toString()}
              onChangeText={(v) =>
                setSettings((s) => ({ ...s, killers: parseInt(v) || 0 }))
              }
              keyboardType="numeric"
            />
            <Text style={styles.label}>Healers:</Text>
            <TextInput
              style={styles.input}
              value={settings.healers.toString()}
              onChangeText={(v) =>
                setSettings((s) => ({ ...s, healers: parseInt(v) || 0 }))
              }
              keyboardType="numeric"
            />
            <Text style={styles.label}>Police:</Text>
            <TextInput
              style={styles.input}
              value={settings.police.toString()}
              onChangeText={(v) =>
                setSettings((s) => ({ ...s, police: parseInt(v) || 0 }))
              }
              keyboardType="numeric"
            />
            <Text style={styles.label}>Total Players:</Text>
            <TextInput
              style={styles.input}
              value={settings.totalPlayers.toString()}
              onChangeText={(v) =>
                setSettings((s) => ({ ...s, totalPlayers: parseInt(v) || 0 }))
              }
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.buttonText}>SAVE CONFIGURATION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#dc2626",
    letterSpacing: 3,
    textAlign: "center",
    textShadowColor: "rgba(220, 38, 38, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    letterSpacing: 1,
  },
  setupCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  networkInfo: {
    marginBottom: 24,
  },
  cardTitle: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  infoLabel: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  instructionsCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#444",
  },
  instructionStep: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  initializeButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  buttonSubtext: {
    color: "#999",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  gameContainer: {
    gap: 20,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#059669",
  },
  statusIndicator: {
    marginBottom: 8,
  },
  statusDot: {
    fontSize: 20,
  },
  statusText: {
    color: "#059669",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusSubtext: {
    color: "#888",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  networkCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  shareButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  playersCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  playerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  playerRole: {
    color: "#888",
    fontSize: 12,
    letterSpacing: 1,
  },
  kickButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#dc2626",
  },
  kickButtonText: {
    fontSize: 14,
  },
  noPlayersText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  actionButtons: {
    gap: 12,
  },
  startButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  stopButton: {
    backgroundColor: "#991b1b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    borderWidth: 1,
    borderColor: "#333",
    minWidth: 300,
  },
  modalTitle: {
    color: "#dc2626",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  label: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
});
