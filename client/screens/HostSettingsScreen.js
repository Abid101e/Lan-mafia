import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { socket } from "../utils/socket";

export default function HostSettingsScreen({ navigation }) {
  const [players, setPlayers] = useState([]);

  const [gameSettings, setGameSettings] = useState({
    killers: 1, // Default 1
    healers: 1, // Default 1
    police: 1, // Default 1
    nightTimer: 45,
    discussionTimer: 120,
    votingTimer: 60,
  });

  useEffect(() => {
    if (!socket?.socket) {
      return;
    }

    const handlePlayersUpdated = (playersData) => {
      setPlayers(playersData || []);
    };

    const handlePlayersResponse = (playersData) => {
      setPlayers(playersData || []);
    };

    // Use socket.socket (the actual socket.io instance)
    socket.socket.on("playersUpdated", handlePlayersUpdated);
    socket.socket.on("playersResponse", handlePlayersResponse);
    socket.socket.on("gameStarted", () => navigation.navigate("NightPhase"));
    socket.socket.on("error", (error) => Alert.alert("Error", error.message));

    // Request current players when component mounts
    if (socket?.socket?.connected) {
      socket.socket.emit("getPlayers", {});

      // Also request again after a short delay in case the first one doesn't work
      setTimeout(() => {
        socket.socket.emit("getPlayers", {});
      }, 1000);
    }

    return () => {
      if (socket?.socket) {
        socket.socket.off("playersUpdated", handlePlayersUpdated);
        socket.socket.off("playersResponse", handlePlayersResponse);
        socket.socket.off("gameStarted");
        socket.socket.off("error");
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (socket?.socket?.connected) {
        socket.socket.emit("getPlayers", {});
      }
    }, [socket])
  );

  const updateSetting = (key, value) => {
    setGameSettings((prev) => ({ ...prev, [key]: value }));
  };

  const calculateTownspeople = () => {
    const { killers, healers, police } = gameSettings;
    const townspeople = Math.max(
      0,
      players.length - killers - healers - police
    );
    return townspeople;
  };

  const getMaxValue = (role) => {
    const playerCount = players.length || 3; // Fallback to 3 if no players loaded yet

    switch (role) {
      case "killers":
        return Math.min(4, Math.floor(playerCount / 2)); // Max 4, but not more than half players
      case "healers":
      case "police":
        return Math.max(0, gameSettings.killers - 1); // Always 1 less than killers
      default:
        return 1;
    }
  };

  const validateSettings = () => {
    const { killers, healers, police } = gameSettings;
    const totalSpecial = killers + healers + police;

    if (players.length < 3) {
      // Changed from 4 to 3 for testing
      Alert.alert("Error", "Need at least 3 players to start (testing mode)");
      return false;
    }

    if (totalSpecial > players.length) {
      Alert.alert("Error", "Too many special roles for player count");
      return false;
    }

    // For 3-player testing, allow 0 townspeople
    if (players.length === 3 && calculateTownspeople() === 0) {
      // Allow 0 townspeople for 3-player testing
    } else if (calculateTownspeople() < 1) {
      Alert.alert(
        "Error",
        "Invalid role distribution - need at least 1 townsperson (except in 3-player testing)"
      );
      return false;
    }

    return true;
  };

  const startGame = () => {
    if (!validateSettings()) return;

    const finalSettings = {
      totalPlayers: players.length,
      roles: {
        killers: gameSettings.killers,
        healers: gameSettings.healers,
        police: gameSettings.police,
        townspeople: calculateTownspeople(),
      },
      timers: {
        nightTimer: gameSettings.nightTimer,
        discussionTimer: gameSettings.discussionTimer,
        votingTimer: gameSettings.votingTimer,
      },
    };

    console.log(
      "🚀 Final settings to send:",
      JSON.stringify(finalSettings, null, 2)
    );

    if (finalSettings.totalPlayers === 0) {
      Alert.alert("Error", "No players found. Please refresh and try again.");
      return;
    }

    socket.socket.emit("startGame", finalSettings);
  };

  const RoleCounter = ({ title, role, icon }) => {
    const currentValue = gameSettings[role];
    const maxValue = getMaxValue(role);
    const canDecrease = currentValue > 1; // Minimum is always 1
    const canIncrease = currentValue < maxValue;

    return (
      <View style={styles.roleContainer}>
        <View style={styles.roleHeader}>
          <Text style={styles.roleTitle}>
            {icon} {title}
          </Text>
          <Text style={styles.roleCount}>{currentValue}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !canDecrease && styles.buttonDisabled]}
            onPress={() => canDecrease && updateSetting(role, currentValue - 1)}
            disabled={!canDecrease}
          >
            <Text
              style={[
                styles.buttonText,
                !canDecrease && styles.buttonTextDisabled,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{currentValue}</Text>
            <Text style={styles.maxText}>Max: {maxValue}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, !canIncrease && styles.buttonDisabled]}
            onPress={() => canIncrease && updateSetting(role, currentValue + 1)}
            disabled={!canIncrease}
          >
            <Text
              style={[
                styles.buttonText,
                !canIncrease && styles.buttonTextDisabled,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TimerSetting = ({ title, setting, icon }) => {
    const currentValue = gameSettings[setting];
    const minValue =
      setting === "nightTimer" ? 30 : setting === "discussionTimer" ? 60 : 30;
    const maxValue = setting === "discussionTimer" ? 300 : 120;
    const step = 15;

    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerTitle}>
            {icon} {title}
          </Text>
          <Text style={styles.timerValue}>
            {Math.floor(currentValue / 60)}m {currentValue % 60}s
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              currentValue <= minValue && styles.buttonDisabled,
            ]}
            onPress={() =>
              currentValue > minValue &&
              updateSetting(setting, currentValue - step)
            }
            disabled={currentValue <= minValue}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{currentValue}s</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              currentValue >= maxValue && styles.buttonDisabled,
            ]}
            onPress={() =>
              currentValue < maxValue &&
              updateSetting(setting, currentValue + step)
            }
            disabled={currentValue >= maxValue}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Game Settings</Text>

      {/* Debug info */}
      <View style={[styles.playersInfo, { backgroundColor: "#ff4444" }]}>
        <Text style={styles.playersCount}>
          🔍 DEBUG: Players array length: {players.length}
        </Text>
        <Text style={styles.playersCount}>
          🔍 Players data: {JSON.stringify(players.map((p) => p.name))}
        </Text>
      </View>

      <View style={styles.playersInfo}>
        <Text style={styles.playersCount}>👥 Players: {players.length}</Text>
        <Text style={styles.townspeopleCount}>
          🏘️ Townspeople: {calculateTownspeople()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Roles</Text>
        <Text style={styles.sectionSubtitle}>
          Killers can be up to 4, others max {gameSettings.killers - 1}
        </Text>

        <RoleCounter title="Killers" role="killers" icon="🔪" />
        <RoleCounter title="Healers" role="healers" icon="💊" />
        <RoleCounter title="Police" role="police" icon="👮" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Phase Timers</Text>

        <TimerSetting title="Night Phase" setting="nightTimer" icon="🌙" />
        <TimerSetting title="Discussion" setting="discussionTimer" icon="💬" />
        <TimerSetting title="Voting" setting="votingTimer" icon="🗳️" />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>📋 Game Summary</Text>
        <Text style={styles.summaryText}>
          {players.length} players: {gameSettings.killers} killers,{" "}
          {gameSettings.healers} healers, {gameSettings.police} police,{" "}
          {calculateTownspeople()} townspeople
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          players.length < 3 && styles.buttonDisabled, // Changed from 4 to 3
        ]}
        onPress={startGame}
        disabled={players.length < 3} // Changed from 4 to 3
      >
        <Text style={styles.startButtonText}>
          {players.length < 3
            ? "Need More Players (Testing: Min 3)"
            : "🚀 Start Game"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Lobby</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  playersInfo: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playersCount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  townspeopleCount: {
    color: "#4ecdc4",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionSubtitle: {
    color: "#999",
    fontSize: 14,
    marginBottom: 15,
  },
  roleContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  roleTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  roleCount: {
    color: "#feca57",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#444",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#222",
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#666",
  },
  valueDisplay: {
    alignItems: "center",
    flex: 1,
  },
  valueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  maxText: {
    color: "#999",
    fontSize: 12,
  },
  timerContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timerValue: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "bold",
  },
  summary: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: "#00ff88",
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
  },
  startButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
