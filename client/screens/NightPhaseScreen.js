/**
 * Night Phase Screen Component
 *
 * Interface for players with special roles to perform their night actions.
 * Different UI based on player role (killer, healer, police, townsperson).
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { socket } from "../utils/socket";
import { getRoleInfo } from "../constants/roles";
import TimerBar from "../components/TimerBar";
import PlayerCard from "../components/PlayerCard";

const { width } = Dimensions.get("window");

export default function NightPhaseScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    startPulseAnimation();

    socket.on("playersUpdated", setPlayers);
    socket.on("roleAssigned", setPlayerRole);
    socket.on("timerUpdate", setTimeLeft);
    socket.on("nightActionResult", handleActionResult);
    socket.on("gamePhaseChanged", (phase) => {
      if (phase === "discussion") {
        navigation.navigate("Discussion");
      }
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("roleAssigned");
      socket.off("timerUpdate");
      socket.off("nightActionResult");
      socket.off("gamePhaseChanged");
    };
  }, [navigation]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleActionResult = (result) => {
    if (result.success) {
      Alert.alert("Action Completed", result.message);
    } else {
      Alert.alert("Action Failed", result.error);
      setActionSubmitted(false);
    }
  };

  const submitAction = () => {
    if (!selectedTarget || actionSubmitted) return;

    const actionType = getActionType();
    if (!actionType) return;

    socket.emit("nightAction", {
      action: actionType,
      target: selectedTarget,
    });
    setActionSubmitted(true);
  };

  const getActionType = () => {
    switch (playerRole) {
      case "killer":
        return "kill";
      case "healer":
        return "heal";
      case "police":
        return "investigate";
      default:
        return null;
    }
  };

  const canSelectTarget = () => {
    return (
      ["killer", "healer", "police"].includes(playerRole) &&
      !actionSubmitted &&
      timeLeft > 0
    );
  };

  const getInstructions = () => {
    switch (playerRole) {
      case "killer":
        return "🔪 Choose a player to eliminate tonight";
      case "healer":
        return "💚 Choose a player to protect from harm";
      case "police":
        return "🔍 Choose a player to investigate their role";
      default:
        return "😴 Sleep tight! Wait for the morning to come...";
    }
  };

  const getPhaseTitle = () => {
    switch (playerRole) {
      case "killer":
        return "🌙 Killer's Turn";
      case "healer":
        return "🌙 Healer's Turn";
      case "police":
        return "🌙 Police Investigation";
      default:
        return "🌙 Night Phase";
    }
  };

  const getActionButtonText = () => {
    if (actionSubmitted) return "✓ Action Submitted";
    if (!selectedTarget) return "Select a Target";

    switch (playerRole) {
      case "killer":
        return "🔪 Eliminate Target";
      case "healer":
        return "💚 Protect Target";
      case "police":
        return "🔍 Investigate Target";
      default:
        return "Submit Action";
    }
  };

  const renderPlayer = ({ item }) => {
    const isMyself = item.isCurrentPlayer;
    const canSelect = canSelectTarget() && !isMyself && item.isAlive;
    const isSelected = selectedTarget === item.id;

    // Healer cannot heal themselves
    if (playerRole === "healer" && isMyself) {
      return null;
    }

    // Only show alive players for actions
    if (!item.isAlive) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.playerItem,
          isSelected && styles.selectedPlayer,
          !canSelect && styles.disabledPlayer,
        ]}
        onPress={() => canSelect && setSelectedTarget(item.id)}
        disabled={!canSelect}
      >
        <PlayerCard
          player={item}
          showRole={false}
          isSelected={isSelected}
          style={styles.playerCard}
        />
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>SELECTED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const roleInfo = getRoleInfo(playerRole);
  const hasAction = canSelectTarget();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{getPhaseTitle()}</Text>

      <TimerBar
        duration={45}
        timeLeft={timeLeft}
        label="Night Phase"
        color="#2c3e50"
        warningColor="#f39c12"
        dangerColor="#e74c3c"
      />

      <View style={styles.roleInfoContainer}>
        <Text style={styles.roleEmoji}>{roleInfo?.emoji || "😴"}</Text>
        <Text style={styles.roleName}>{roleInfo?.name || "Townsperson"}</Text>
      </View>

      <Text style={styles.instructions}>{getInstructions()}</Text>

      {hasAction && (
        <>
          <Text style={styles.playerListTitle}>Select Your Target:</Text>
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
          />

          <Animated.View
            style={[
              styles.actionButtonContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!selectedTarget || actionSubmitted) && styles.disabledButton,
                actionSubmitted && styles.submittedButton,
              ]}
              onPress={submitAction}
              disabled={!selectedTarget || actionSubmitted}
            >
              <Text style={styles.actionButtonText}>
                {getActionButtonText()}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {!hasAction && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            💤 You have no actions to perform tonight
          </Text>
          <Text style={styles.waitingSubtext}>
            Relax and wait for the morning phase
          </Text>
        </View>
      )}

      {actionSubmitted && (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>
            ✅ Your action has been submitted
          </Text>
          <Text style={styles.submittedSubtext}>
            Waiting for other players to complete their actions...
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  roleInfoContainer: {
    backgroundColor: "#16213e",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  roleName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  instructions: {
    fontSize: 16,
    color: "#a8b2d1",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  playerListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
    marginBottom: 20,
  },
  row: {
    justifyContent: "space-around",
  },
  playerItem: {
    marginBottom: 15,
    marginHorizontal: 5,
  },
  selectedPlayer: {
    backgroundColor: "#0f3460",
    borderRadius: 10,
    padding: 5,
    borderWidth: 2,
    borderColor: "#4ecdc4",
  },
  disabledPlayer: {
    opacity: 0.5,
  },
  playerCard: {
    width: width * 0.4,
  },
  selectedIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#4ecdc4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 250,
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: "#555",
    shadowColor: "#555",
  },
  submittedButton: {
    backgroundColor: "#27ae60",
    shadowColor: "#27ae60",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  waitingText: {
    fontSize: 20,
    color: "#a8b2d1",
    textAlign: "center",
    marginBottom: 15,
  },
  waitingSubtext: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
  },
  submittedContainer: {
    backgroundColor: "#27ae60",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submittedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  submittedSubtext: {
    color: "#d5f4e6",
    fontSize: 14,
    textAlign: "center",
  },
});
