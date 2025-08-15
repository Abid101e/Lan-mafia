import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { socket } from "../utils/socket";
import { getRoleInfo } from "../constants/roles";
import RoleCard from "../components/RoleCard";

const { width, height } = Dimensions.get("window");

export default function RoleRevealScreen({ navigation }) {
  const [playerRole, setPlayerRole] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    console.log("🎭 RoleReveal screen mounted, setting up listeners");

    socket.socket.on("roleAssigned", (role) => {
      console.log("🎭 Role assigned:", role);
      setPlayerRole(role);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });

    socket.socket.on("gamePhaseChanged", (phase) => {
      console.log("🎮 Game phase changed to:", phase);
      if (phase === "night") {
        console.log("🌙 Navigating to NightPhase");
        navigation.navigate("NightPhase");
      }
    });

    return () => {
      console.log("🧹 RoleReveal screen cleanup");
      socket.socket.off("roleAssigned");
      socket.socket.off("gamePhaseChanged");
    };
  }, [navigation]);

  const handleReady = () => {
    setIsReady(true);
    socket.socket.emit("playerReady");
    console.log("📤 Player ready event sent");
  };

  if (!playerRole) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <Text style={styles.loadingText}>🎭 Assigning Roles...</Text>
          <Text style={styles.subText}>
            Please wait while the game prepares
          </Text>
        </Animated.View>
      </View>
    );
  }

  const roleInfo = getRoleInfo(playerRole);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>🎭 Your Secret Role</Text>

      <Animated.View
        style={[
          styles.roleContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <RoleCard
          role={playerRole}
          showDetails={true}
          style={styles.roleCard}
        />
      </Animated.View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>📋 Remember:</Text>
        <Text style={styles.instruction}>
          • Keep your role secret from other players
        </Text>
        <Text style={styles.instruction}>
          • Work with your team to achieve victory
        </Text>
        <Text style={styles.instruction}>• Use your abilities wisely</Text>
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.detailsButtonText}>
          {showDetails ? "Hide Strategy" : "Show Strategy"}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <Animated.View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>🎯 Win Condition:</Text>
          <Text style={styles.detailsText}>{roleInfo.winCondition}</Text>

          {roleInfo.canAct && (
            <>
              <Text style={styles.detailsTitle}>⚡ Your Ability:</Text>
              <Text style={styles.detailsText}>
                {roleInfo.actionDescription}
              </Text>
            </>
          )}

          <Text style={styles.detailsTitle}>💡 Strategy Tips:</Text>
          <Text style={styles.detailsText}>
            {roleInfo.tips || "Stay alert and trust your instincts!"}
          </Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={[styles.readyButton, isReady && styles.readyButtonDisabled]}
        onPress={handleReady}
        disabled={isReady}
      >
        <Text style={styles.readyButtonText}>
          {isReady ? "✓ Ready - Waiting for others" : "🚀 I'm Ready!"}
        </Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  roleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  roleCard: {
    width: width * 0.8,
  },
  instructionsContainer: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  instruction: {
    fontSize: 14,
    color: "#bdc3c7",
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: "center",
    marginBottom: 20,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "#34495e",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 15,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: "#ecf0f1",
    lineHeight: 20,
    marginBottom: 10,
  },
  readyButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: "center",
    minWidth: 200,
    shadowColor: "#27ae60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  readyButtonDisabled: {
    backgroundColor: "#7f8c8d",
    shadowColor: "#7f8c8d",
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
