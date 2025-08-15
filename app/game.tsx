import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GameState, Role } from "../types/game";
import {
  getRoleDescription,
  getRoleEmoji,
  getRoleImage,
} from "../utils/gameLogic";
import { socketManager } from "../utils/socketManager";

export default function GameScreen() {
  const { playerName } = useLocalSearchParams<{ playerName: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [nightResults, setNightResults] = useState<any>(null);
  const [voteResults, setVoteResults] = useState<any>(null);
  const [firstPhaseOver, setFirstPhaseOver] = useState(false);

  useEffect(() => {
    // Set up game event listeners
    socketManager.on("gameStateUpdated", (state: GameState) => {
      setGameState(state);
    });

    socketManager.on("roleAssigned", (role: Role) => {
      setMyRole(role);
      setShowRoleModal(true);
      setFirstPhaseOver(false); // Reset for new game
    });

    socketManager.on("nightResults", (results: any) => {
      setNightResults(results);
      setShowResultsModal(true);
      setFirstPhaseOver(true); // First night phase is over
    });

    socketManager.on("voteResults", (results: any) => {
      setVoteResults(results);
      setShowResultsModal(true);
    });

    socketManager.on("gameOver", (winner: "Killers" | "Civilians") => {
      Alert.alert("Game Over!", `${winner} win!`, [
        {
          text: "Back to Menu",
          onPress: () => {
            socketManager.disconnect();
            router.push("/");
          },
        },
      ]);
    });

    return () => {
      socketManager.off("gameStateUpdated");
      socketManager.off("roleAssigned");
      socketManager.off("nightResults");
      socketManager.off("voteResults");
      socketManager.off("gameOver");
    };
  }, []);

  const handleNightAction = () => {
    if (!selectedTarget) {
      Alert.alert("Error", "Please select a target");
      return;
    }

    if (!myRole) return;

    let action: "kill" | "heal" | "investigate";
    switch (myRole) {
      case "Killer":
        action = "kill";
        break;
      case "Healer":
        action = "heal";
        break;
      case "Police":
        action = "investigate";
        break;
      default:
        return;
    }

    socketManager.submitNightAction(selectedTarget, action);
    setSelectedTarget(null);
  };

  const handleVote = () => {
    if (!selectedTarget) {
      Alert.alert("Error", "Please select a player to vote for");
      return;
    }

    socketManager.submitVote(selectedTarget);
    setSelectedTarget(null);
  };

  const renderNightPhase = () => {
    if (!myRole || !["Killer", "Healer", "Police"].includes(myRole)) {
      return (
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseTitle}>🌙 NIGHT CYCLE</Text>
          <Text style={styles.phaseDescription}>
            NIGHT CYCLE ACTIVE. SPECIAL OPERATORS PERFORMING COVERT ACTIONS.
          </Text>
        </View>
      );
    }

    const alivePlayers =
      gameState?.players.filter((p) => p.isAlive && p.name !== playerName) ||
      [];

    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>🌙 NIGHT CYCLE</Text>
        <Text style={styles.roleInfo}>
          OPERATOR PROFILE: {getRoleEmoji(myRole)} {myRole}
        </Text>
        <Text style={styles.actionDescription}>
          {myRole === "Killer" && "Choose a player to eliminate"}
          {myRole === "Healer" && "Choose a player to protect"}
          {myRole === "Police" && "Choose a player to investigate"}
        </Text>

        <ScrollView style={styles.playerList}>
          {alivePlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerItem,
                selectedTarget === player.id && styles.selectedPlayer,
              ]}
              onPress={() => setSelectedTarget(player.id)}
            >
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerStatus}>
                {player.isAlive ? "🟢 Alive" : "🔴 Dead"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.actionButton,
            !selectedTarget && styles.buttonDisabled,
          ]}
          onPress={handleNightAction}
          disabled={!selectedTarget}
        >
          <Text style={styles.buttonText}>EXECUTE ACTION</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDayPhase = () => {
    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>☀️ DAY CYCLE</Text>
        <Text style={styles.phaseDescription}>
          DAY CYCLE ACTIVE. ANALYZE DATA AND IDENTIFY HOSTILE OPERATORS.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // In a real app, this would trigger voting phase
            Alert.alert("Voting", "Host will start voting phase when ready");
          }}
        >
          <Text style={styles.buttonText}>INITIATE VOTING</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVotingPhase = () => {
    const alivePlayers =
      gameState?.players.filter((p) => p.isAlive && p.name !== playerName) ||
      [];

    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>🗳️ VOTING PROTOCOL</Text>
        <Text style={styles.phaseDescription}>
          SELECT TARGET FOR TERMINATION. VOTE FOR SUSPECTED HOSTILE OPERATOR.
        </Text>

        <ScrollView style={styles.playerList}>
          {alivePlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerItem,
                selectedTarget === player.id && styles.selectedPlayer,
              ]}
              onPress={() => setSelectedTarget(player.id)}
            >
              <Text style={styles.playerName}>{player.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.actionButton,
            !selectedTarget && styles.buttonDisabled,
          ]}
          onPress={handleVote}
          disabled={!selectedTarget}
        >
          <Text style={styles.buttonText}>EXECUTE VOTE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentPhase = () => {
    if (!gameState) return null;

    switch (gameState.phase) {
      case "night":
        return renderNightPhase();
      case "day":
        return renderDayPhase();
      case "voting":
        return renderVotingPhase();
      default:
        return (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseTitle}>Waiting...</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LAN MAFIA</Text>
        <Text style={styles.roundInfo}>
          Round {gameState?.currentRound || 1} - {gameState?.phase || "lobby"}
        </Text>
      </View>

      {renderCurrentPhase()}

      {/* Role Reveal Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>OPERATOR PROFILE</Text>
            <Image
              source={getRoleImage(myRole)}
              style={styles.roleImage}
              resizeMode="contain"
            />
            <Text style={styles.roleDisplay}>
              {getRoleEmoji(myRole || "Civilian")} {myRole}
            </Text>
            <Text style={styles.roleDescription}>
              {getRoleDescription(myRole || "Civilian")}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, !firstPhaseOver && { opacity: 0.5 }]}
              onPress={() => firstPhaseOver && setShowRoleModal(false)}
              disabled={!firstPhaseOver}
            >
              <Text style={styles.buttonText}>
                {firstPhaseOver
                  ? "ACKNOWLEDGED"
                  : "WAIT FOR NIGHT PHASE TO END"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={showResultsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MISSION REPORT</Text>
            {nightResults && (
              <View>
                {nightResults.killed.length > 0 && (
                  <Text style={styles.resultText}>
                    💀{" "}
                    {nightResults.killed
                      .map(
                        (id: string) =>
                          gameState?.players.find((p) => p.id === id)?.name
                      )
                      .join(", ")}{" "}
                    was killed
                  </Text>
                )}
                {nightResults.healed.length > 0 && (
                  <Text style={styles.resultText}>
                    💊{" "}
                    {nightResults.healed
                      .map(
                        (id: string) =>
                          gameState?.players.find((p) => p.id === id)?.name
                      )
                      .join(", ")}{" "}
                    was healed
                  </Text>
                )}
              </View>
            )}
            {voteResults && (
              <Text style={styles.resultText}>
                🗳️{" "}
                {
                  gameState?.players.find(
                    (p) => p.id === voteResults.eliminatedPlayer
                  )?.name
                }{" "}
                was eliminated ({voteResults.role})
              </Text>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowResultsModal(false);
              }}
            >
              <Text style={styles.buttonText}>PROCEED</Text>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 2,
    borderBottomColor: "#00ffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00ffff",
    textAlign: "center",
    textShadowColor: "#00ffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  roundInfo: {
    fontSize: 14,
    color: "#ff00ff",
    textAlign: "center",
    marginTop: 5,
    letterSpacing: 1,
  },
  phaseContainer: {
    flex: 1,
    padding: 20,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00ffff",
    marginBottom: 10,
    textShadowColor: "#00ffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  phaseDescription: {
    fontSize: 14,
    color: "#ff00ff",
    marginBottom: 20,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  roleInfo: {
    fontSize: 16,
    color: "#00ff00",
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: "#ff00ff",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  playerList: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 0,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#00ffff",
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#00ffff",
  },
  selectedPlayer: {
    backgroundColor: "#00ff00",
    borderRadius: 0,
  },
  playerName: {
    fontSize: 16,
    color: "#00ffff",
    fontWeight: "500",
  },
  playerStatus: {
    fontSize: 14,
    color: "#ff00ff",
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 0,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00ff00",
  },
  buttonDisabled: {
    backgroundColor: "transparent",
    borderColor: "#666",
  },
  buttonText: {
    color: "#00ff00",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 0,
    margin: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00ffff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00ffff",
    marginBottom: 20,
    textShadowColor: "#00ffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  roleDisplay: {
    fontSize: 32,
    marginBottom: 15,
  },
  roleDescription: {
    fontSize: 14,
    color: "#ff00ff",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  modalButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#00ff00",
  },
  resultText: {
    fontSize: 16,
    color: "#00ffff",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  roleImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },
});
