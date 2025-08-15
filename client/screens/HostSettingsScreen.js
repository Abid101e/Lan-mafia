import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { socket } from "../utils/socket";

export default function HostSettingsScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    killers: 2,
    healers: 1,
    police: 1,
    nightTimer: 45,
    discussionTimer: 120,
    votingTimer: 60,
  });

  useEffect(() => {
    socket.on("playersUpdated", setPlayers);
    socket.on("gameStarted", () => navigation.navigate("RoleReveal"));
    socket.on("error", (error) => Alert.alert("Error", error.message));
    socket.on("settingsUpdated", (data) => {
      console.log("Settings saved successfully:", data);
      // Could add a brief success indicator here if needed
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("gameStarted");
      socket.off("error");
      socket.off("settingsUpdated");
    };
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...gameSettings, [key]: value };
    setGameSettings(newSettings);

    // Auto-save: Send updated settings to server immediately
    socket.emit("updateGameSettings", {
      gameCode: "current", // Server should use current game
      settings: newSettings,
    });

    console.log(`Updated ${key} to ${value}`, newSettings);
  };

  const calculateTownspeople = () => {
    const { killers, healers, police } = gameSettings;
    return Math.max(0, players.length - killers - healers - police);
  };

  const validateSettings = () => {
    const { killers, healers, police } = gameSettings;
    const totalSpecial = killers + healers + police;

    if (players.length < 4) {
      Alert.alert("Error", "Need at least 4 players to start");
      return false;
    }

    if (totalSpecial >= players.length) {
      Alert.alert("Error", "Too many special roles for player count");
      return false;
    }

    if (killers < 1) {
      Alert.alert("Error", "Need at least 1 killer");
      return false;
    }

    return true;
  };

  const startGame = () => {
    if (!validateSettings()) return;

    const finalSettings = {
      ...gameSettings,
      townspeople: calculateTownspeople(),
      totalPlayers: players.length,
    };

    socket.emit("startGame", finalSettings);
  };

  const RoleCounter = ({ title, role, min = 0, max = 5, icon }) => {
    const currentValue = gameSettings[role];
    const canDecrease = currentValue > min;
    const canIncrease = currentValue < max;

    return (
      <View style={styles.roleContainer}>
        <View style={styles.roleHeader}>
          <Text style={styles.roleTitle}>
            {icon} {title}
          </Text>
          <Text style={styles.roleCount}>{currentValue}</Text>
        </View>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[
              styles.adjustButton,
              !canDecrease && styles.disabledAdjustButton,
            ]}
            onPress={() => {
              if (canDecrease) {
                updateSetting(role, currentValue - 1);
              }
            }}
            disabled={!canDecrease}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.adjustButtonText,
                !canDecrease && styles.disabledButtonText,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>
          <View style={styles.slider}>
            <Text style={styles.sliderValue}>{currentValue}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.adjustButton,
              !canIncrease && styles.disabledAdjustButton,
            ]}
            onPress={() => {
              if (canIncrease) {
                updateSetting(role, currentValue + 1);
              }
            }}
            disabled={!canIncrease}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.adjustButtonText,
                !canIncrease && styles.disabledButtonText,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TimerSetting = ({ title, setting, min = 15, max = 300, icon }) => {
    const currentValue = gameSettings[setting];
    const canDecrease = currentValue > min;
    const canIncrease = currentValue < max;

    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerTitle}>
            {icon} {title}
          </Text>
          <Text style={styles.timerValue}>{currentValue}s</Text>
        </View>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[
              styles.adjustButton,
              !canDecrease && styles.disabledAdjustButton,
            ]}
            onPress={() => {
              if (canDecrease) {
                updateSetting(setting, currentValue - 15);
              }
            }}
            disabled={!canDecrease}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.adjustButtonText,
                !canDecrease && styles.disabledButtonText,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>
          <View style={styles.slider}>
            <Text style={styles.sliderValue}>
              {Math.floor(currentValue / 60)}m {currentValue % 60}s
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.adjustButton,
              !canIncrease && styles.disabledAdjustButton,
            ]}
            onPress={() => {
              if (canIncrease) {
                updateSetting(setting, currentValue + 15);
              }
            }}
            disabled={!canIncrease}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.adjustButtonText,
                !canIncrease && styles.disabledButtonText,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Game Configuration</Text>

      <View style={styles.playersInfo}>
        <Text style={styles.playersCount}>👥 Players: {players.length}</Text>
        <Text style={styles.townspeopleCount}>
          🏘️ Townspeople: {calculateTownspeople()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Roles</Text>

        <RoleCounter
          title="Killers"
          role="killers"
          min={1}
          max={Math.max(1, Math.floor(players.length / 2))}
          icon="🔪"
        />

        <RoleCounter
          title="Healers"
          role="healers"
          min={0}
          max={Math.min(3, Math.floor(players.length / 3))}
          icon="💊"
        />

        <RoleCounter
          title="Police"
          role="police"
          min={0}
          max={Math.min(2, Math.floor(players.length / 4))}
          icon="👮"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Phase Timers</Text>

        <TimerSetting
          title="Night Phase"
          setting="nightTimer"
          min={30}
          max={120}
          icon="🌙"
        />

        <TimerSetting
          title="Discussion"
          setting="discussionTimer"
          min={60}
          max={300}
          icon="💬"
        />

        <TimerSetting
          title="Voting"
          setting="votingTimer"
          min={30}
          max={120}
          icon="🗳️"
        />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>📋 Game Summary</Text>
        <Text style={styles.summaryText}>
          {players.length} players: {gameSettings.killers} killers,{" "}
          {gameSettings.healers} healers,
          {gameSettings.police} police, {calculateTownspeople()} townspeople
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          players.length < 4 && styles.disabledButton,
        ]}
        onPress={startGame}
        disabled={players.length < 4}
      >
        <Text style={styles.startButtonText}>
          {players.length < 4 ? "Need More Players" : "🚀 Start Game"}
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
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  adjustButton: {
    backgroundColor: "#444",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "#666",
  },
  disabledAdjustButton: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333",
    opacity: 0.5,
  },
  adjustButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  disabledButtonText: {
    color: "#666",
  },
  slider: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 20,
  },
  sliderValue: {
    color: "#ccc",
    fontSize: 14,
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
  disabledButton: {
    backgroundColor: "#666",
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
