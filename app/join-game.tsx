import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GameState, Player } from "../types/game";
import { getSocketURL } from "../utils/networkUtils";
import { socketManager } from "../utils/socketManager";
import { MafiaTheme } from "../utils/theme";

export default function JoinGameScreen() {
  const { playerName, hostIP } = useLocalSearchParams<{
    playerName: string;
    hostIP: string;
  }>();

  // Debug log to check parameters
  console.log("JoinGameScreen params:", { playerName, hostIP });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [serverUrl, setServerUrl] = useState("");

  useEffect(() => {
    if (hostIP) {
      const url = getSocketURL(hostIP, 3000);
      setServerUrl(url);
    }
  }, [hostIP]);

  const connectToGame = async () => {
    // Convert params to string if they're arrays (Expo Router sometimes passes arrays)
    const nameParam = Array.isArray(playerName) ? playerName[0] : playerName;
    const ipParam = Array.isArray(hostIP) ? hostIP[0] : hostIP;

    if (!nameParam?.trim() || !ipParam?.trim()) {
      Alert.alert("Error", "Missing player name or host IP");
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to the server
      await socketManager.connect(serverUrl);

      // Join the game
      socketManager.joinGame(playerName);

      // Set up event listeners
      socketManager.on("gameStateUpdated", (state: GameState) => {
        setGameState(state);
      });

      socketManager.on("gameStarted", (state: GameState) => {
        setIsConnected(true);
        setGameState(state);
        // Navigate to game screen
        router.push({
          pathname: "/game",
          params: { playerName, hostIP },
        });
      });

      socketManager.on("playerJoined", (player: Player) => {
        Alert.alert("Player Joined", `${player.name} has joined the game!`);
      });

      socketManager.on("playerLeft", (playerId: string) => {
        Alert.alert("Player Left", "A player has left the game");
      });

      socketManager.on("error", (message: string) => {
        Alert.alert("Error", message);
      });

      setIsConnected(true);
      Alert.alert(
        "HOTSPOT CONNECTED!",
        "Successfully connected to host hotspot.\n\nWaiting for host to start the game...\n\nMake sure you stay connected to the hotspot."
      );
    } catch (error: any) {
      console.error("Connection error:", error);
      Alert.alert(
        "HOTSPOT CONNECTION FAILED",
        "Failed to connect to host.\n\nTROUBLESHOOT:\n1. Are you connected to host's hotspot?\n2. Is the IP address correct? (usually 192.168.43.1)\n3. Is the host's server running?\n4. Try reconnecting to the hotspot"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    socketManager.disconnect();
    setIsConnected(false);
    setGameState(null);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={MafiaTheme.colors.background}
      />

      <Text style={styles.title}>INFILTRATE OPERATION</Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>OPERATIVE DETAILS</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CODENAME:</Text>
          <Text style={styles.infoValue}>{playerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>TARGET:</Text>
          <Text style={styles.infoValue}>{hostIP}</Text>
        </View>
      </View>

      {!isConnected ? (
        <View style={styles.connectContainer}>
          <View style={styles.instructionsCard}>
            <Text style={styles.cardTitle}>MISSION BRIEFING</Text>
            <Text style={styles.instructionItem}>
              1. Connect to operation network
            </Text>
            <Text style={styles.instructionItem}>
              2. Verify secure channel established
            </Text>
            <Text style={styles.instructionItem}>
              3. Await mission coordinator signal
            </Text>
            <Text style={styles.instructionItem}>
              4. Maintain network connectivity
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isConnecting && styles.disabledButton]}
            onPress={connectToGame}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color={MafiaTheme.colors.text} />
            ) : (
              <Text style={styles.buttonText}>ESTABLISH CONNECTION</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>ABORT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.lobbyContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.status}>CONNECTION SECURED</Text>
            <Text style={styles.waiting}>Awaiting mission commencement...</Text>
          </View>

          {gameState && (
            <View style={styles.gameInfo}>
              <Text style={styles.cardTitle}>OPERATION ROSTER</Text>
              <Text style={styles.playerCount}>
                {gameState.players.length} operatives ready • max 8
              </Text>

              <ScrollView style={styles.playerList}>
                {gameState.players.map((player) => (
                  <View key={player.id} style={styles.playerItem}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerInitial}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {player.isHost && (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>COORDINATOR</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnect}
          >
            <Text style={styles.buttonText}>TERMINATE CONNECTION</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MafiaTheme.colors.background,
    padding: MafiaTheme.spacing.lg,
  },
  title: {
    fontSize: MafiaTheme.typography.fontSize.xl,
    fontWeight: "bold",
    color: MafiaTheme.colors.primary,
    textAlign: "center",
    marginBottom: MafiaTheme.spacing.xl,
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoCard: {
    backgroundColor: MafiaTheme.colors.card,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    marginBottom: MafiaTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MafiaTheme.colors.border,
    ...MafiaTheme.shadows.light,
  },
  infoContainer: {
    backgroundColor: MafiaTheme.colors.card,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    marginBottom: MafiaTheme.spacing.lg,
  },
  cardTitle: {
    fontSize: MafiaTheme.typography.fontSize.sm,
    color: MafiaTheme.colors.subText,
    marginBottom: MafiaTheme.spacing.sm,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: MafiaTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: MafiaTheme.colors.border,
  },
  infoLabel: {
    fontSize: MafiaTheme.typography.fontSize.sm,
    color: MafiaTheme.colors.subText,
    width: "30%",
  },
  infoValue: {
    fontSize: MafiaTheme.typography.fontSize.md,
    color: MafiaTheme.colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  connectContainer: {
    flex: 1,
    justifyContent: "center",
  },
  instructionsCard: {
    backgroundColor: MafiaTheme.colors.card,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    marginBottom: MafiaTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MafiaTheme.colors.border,
    ...MafiaTheme.shadows.medium,
  },
  instructionItem: {
    fontSize: MafiaTheme.typography.fontSize.md,
    color: MafiaTheme.colors.text,
    marginVertical: MafiaTheme.spacing.sm,
    paddingLeft: MafiaTheme.spacing.sm,
  },
  instructions: {
    fontSize: MafiaTheme.typography.fontSize.sm,
    color: MafiaTheme.colors.subText,
    marginBottom: MafiaTheme.spacing.lg,
    lineHeight: 20,
    textAlign: "center",
  },
  lobbyContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: MafiaTheme.colors.card,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    marginBottom: MafiaTheme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: MafiaTheme.colors.success,
    ...MafiaTheme.shadows.light,
  },
  status: {
    fontSize: MafiaTheme.typography.fontSize.lg,
    color: MafiaTheme.colors.success,
    fontWeight: "600",
    marginBottom: MafiaTheme.spacing.xs,
  },
  waiting: {
    fontSize: MafiaTheme.typography.fontSize.sm,
    color: MafiaTheme.colors.subText,
    marginBottom: MafiaTheme.spacing.sm,
  },
  gameInfo: {
    flex: 1,
    backgroundColor: MafiaTheme.colors.card,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    marginBottom: MafiaTheme.spacing.md,
    ...MafiaTheme.shadows.medium,
  },
  playerCount: {
    fontSize: MafiaTheme.typography.fontSize.sm,
    color: MafiaTheme.colors.subText,
    marginBottom: MafiaTheme.spacing.md,
  },
  playerList: {
    flex: 1,
    marginBottom: MafiaTheme.spacing.md,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: MafiaTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: MafiaTheme.colors.border,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MafiaTheme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: MafiaTheme.spacing.sm,
  },
  playerInitial: {
    color: MafiaTheme.colors.text,
    fontWeight: "bold",
    fontSize: MafiaTheme.typography.fontSize.md,
  },
  playerName: {
    fontSize: MafiaTheme.typography.fontSize.md,
    color: MafiaTheme.colors.text,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: MafiaTheme.colors.primary,
    paddingHorizontal: MafiaTheme.spacing.sm,
    paddingVertical: 2,
    borderRadius: MafiaTheme.borderRadius.sm,
    marginLeft: MafiaTheme.spacing.sm,
  },
  hostBadgeText: {
    color: MafiaTheme.colors.text,
    fontSize: MafiaTheme.typography.fontSize.xs,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: MafiaTheme.colors.primary,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    alignItems: "center",
    ...MafiaTheme.shadows.medium,
    marginBottom: MafiaTheme.spacing.md,
  },
  disabledButton: {
    backgroundColor: MafiaTheme.colors.disabledButton,
    opacity: 0.7,
  },
  buttonText: {
    color: MafiaTheme.colors.buttonText,
    fontSize: MafiaTheme.typography.fontSize.md,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: MafiaTheme.colors.secondary,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    alignItems: "center",
    ...MafiaTheme.shadows.light,
  },
  cancelButtonText: {
    color: MafiaTheme.colors.text,
    fontSize: MafiaTheme.typography.fontSize.md,
    letterSpacing: 1,
  },
  disconnectButton: {
    backgroundColor: MafiaTheme.colors.danger,
    padding: MafiaTheme.spacing.md,
    borderRadius: MafiaTheme.borderRadius.md,
    alignItems: "center",
    ...MafiaTheme.shadows.medium,
  },
});
