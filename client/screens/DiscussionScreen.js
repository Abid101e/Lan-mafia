import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { socket } from "../utils/socket";
import TimerBar from "../components/TimerBar";
import PlayerCard from "../components/PlayerCard";

const { width } = Dimensions.get("window");

export default function DiscussionScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [nightResults, setNightResults] = useState(null);
  const [investigationResult, setInvestigationResult] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isReady, setIsReady] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState([]);

  useEffect(() => {
    console.log("💬 Discussion screen mounted, setting up listeners");

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Request current players when discussion screen mounts (with small delay)
    console.log("💬 Requesting current players...");
    setTimeout(() => {
      socket.emit("getPlayers");
    }, 100);

    socket.socket.on("playersUpdated", (players) => {
      console.log("👥 Discussion: Players updated:", players);
      setPlayers(players || []);
    });

    socket.socket.on("timerUpdate", (time) => {
      console.log("⏰ Discussion: Timer update:", time);
      setTimeLeft(time);
    });

    socket.socket.on("nightResults", (results) => {
      console.log("🌙 Discussion: Night results received:", results);
      console.log("🌙 Night results details:", {
        message: results?.message,
        deaths: results?.deaths,
        investigations: results?.investigations,
        heals: results?.heals,
      });
      setNightResults(results);
    });

    socket.socket.on("gamePhaseChanged", (phase) => {
      console.log("🎮 Discussion: Game phase changed to:", phase);
      if (phase === "voting") {
        navigation.navigate("Voting");
      } else if (phase === "discussion") {
        // Reset ready status when discussion phase starts
        setIsReady(false);
        setReadyPlayers([]);
      }
    });

    socket.socket.on("gameOver", (result) => {
      console.log("🏁 Discussion: Game over received:", result);
      navigation.navigate("Win");
    });

    socket.socket.on("investigationResult", (result) => {
      console.log("🔍 Discussion: Investigation result received:", result);
      setInvestigationResult(result);
    });

    socket.socket.on("discussionReadyUpdate", (data) => {
      console.log("✅ Discussion: Ready players update:", data);
      setReadyPlayers(data.readyPlayers || []);
    });

    return () => {
      console.log("🧹 Discussion screen cleanup");
      socket.socket.off("playersUpdated");
      socket.socket.off("timerUpdate");
      socket.socket.off("nightResults");
      socket.socket.off("gamePhaseChanged");
      socket.socket.off("gameOver");
      socket.socket.off("investigationResult");
      socket.socket.off("discussionReadyUpdate");
    };
  }, [navigation]);

  const handleReadyToggle = () => {
    console.log(
      "✅ Discussion: Toggling ready status from",
      isReady,
      "to",
      !isReady
    );
    setIsReady(!isReady);
    socket.socket.emit("discussionReady", {
      playerId: socket.socket.id,
      isReady: !isReady,
    });
  };

  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);
  const currentPlayer = players.find((p) => p.socketId === socket.socket.id);
  const isAlive = currentPlayer ? currentPlayer.isAlive : true;

  console.log("📊 Discussion Debug:", {
    totalPlayers: players.length,
    alivePlayers: alivePlayers.length,
    deadPlayers: deadPlayers.length,
    nightResults,
    investigationResult,
    playersDetails: players.map((p) => ({ name: p.name, isAlive: p.isAlive })),
  });

  const renderPlayer = ({ item }) => (
    <PlayerCard
      player={item}
      showRole={false}
      style={[styles.playerCard, !item.isAlive && styles.deadPlayerCard]}
    />
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Discussion Phase</Text>

      <TimerBar
        duration={120}
        timeLeft={timeLeft}
        label="Discussion Time"
        color="#f39c12"
        warningColor="#e67e22"
        dangerColor="#e74c3c"
      />

      {!isAlive && (
        <View style={styles.ghostContainer}>
          <Text style={styles.ghostTitle}>Ghost Mode</Text>
          <Text style={styles.ghostText}>
            You have been eliminated. You can watch the discussion but cannot
            participate.
          </Text>
        </View>
      )}

      {nightResults && (
        <Animated.View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Last Night's Events</Text>
          <Text style={styles.resultsText}>{nightResults.message}</Text>
          {nightResults.eliminated && (
            <Text style={styles.eliminatedText}>
              {nightResults.eliminated} was eliminated
            </Text>
          )}
          {nightResults.investigations &&
            nightResults.investigations.length > 0 && (
              <View style={styles.investigationPublicContainer}>
                {nightResults.investigations.map((inv, index) => (
                  <Text key={index} style={styles.investigationPublicText}>
                    {inv.publicMessage}
                  </Text>
                ))}
              </View>
            )}
        </Animated.View>
      )}

      {investigationResult && (
        <Animated.View style={styles.investigationContainer}>
          <Text style={styles.investigationTitle}>
            Your Investigation Result
          </Text>
          <Text style={styles.investigationText}>
            {investigationResult.message}
          </Text>
        </Animated.View>
      )}

      <Text style={styles.instructions}>
        Discuss who you think the killers are. Share information and suspicions
        carefully!
      </Text>

      {isAlive && (
        <View style={styles.readySection}>
          <TouchableOpacity
            style={[
              styles.readyButton,
              isReady ? styles.readyButtonActive : styles.readyButtonInactive,
            ]}
            onPress={handleReadyToggle}
          >
            <Text style={styles.readyButtonText}>
              {isReady ? "✅ Ready for Voting" : "⏰ Not Ready"}
            </Text>
          </TouchableOpacity>
          {readyPlayers.length > 0 && (
            <Text style={styles.readyCount}>
              {readyPlayers.length} / {alivePlayers.length} players ready
            </Text>
          )}
        </View>
      )}

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>
          Alive Players ({alivePlayers.length})
        </Text>
        <FlatList
          data={alivePlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      </View>

      {deadPlayers.length > 0 && (
        <View style={styles.deadSection}>
          <Text style={styles.deadTitle}>
            💀 Eliminated ({deadPlayers.length})
          </Text>
          <FlatList
            data={deadPlayers}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.deadList}
          />
        </View>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  ghostContainer: {
    backgroundColor: "#2c2c54",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#7f8c8d",
    alignItems: "center",
  },
  ghostTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#bdc3c7",
    marginBottom: 8,
  },
  ghostText: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 20,
  },
  resultsContainer: {
    backgroundColor: "#2c3e50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  resultsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultsText: {
    color: "#bdc3c7",
    fontSize: 14,
    lineHeight: 20,
  },
  eliminatedText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  investigationContainer: {
    backgroundColor: "#2c3e50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  investigationTitle: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  investigationText: {
    color: "#ecf0f1",
    fontSize: 14,
    lineHeight: 20,
  },
  instructions: {
    color: "#95a5a6",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  playersSection: {
    flex: 1,
  },
  sectionTitle: {
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
    marginHorizontal: 5,
  },
  deadPlayerCard: {
    opacity: 0.6,
  },
  row: {
    justifyContent: "space-around",
  },
  deadSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  deadTitle: {
    color: "#7f8c8d",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  deadList: {
    flexGrow: 0,
  },
  investigationPublicContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#34495e",
  },
  investigationPublicText: {
    color: "#95a5a6",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 5,
  },
  readySection: {
    alignItems: "center",
    marginBottom: 20,
  },
  readyButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
    minWidth: 200,
    alignItems: "center",
  },
  readyButtonActive: {
    backgroundColor: "#27ae60",
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  readyButtonInactive: {
    backgroundColor: "#34495e",
    borderWidth: 2,
    borderColor: "#95a5a6",
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  readyCount: {
    color: "#95a5a6",
    fontSize: 14,
    textAlign: "center",
  },
});
