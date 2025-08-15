import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { socket } from "../utils/socket";
import TimerBar from "../components/TimerBar";
import PlayerCard from "../components/PlayerCard";

const { width } = Dimensions.get("window");

export default function DiscussionScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [nightResults, setNightResults] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    socket.on("playersUpdated", setPlayers);
    socket.on("timerUpdate", setTimeLeft);
    socket.on("nightResults", setNightResults);
    socket.on("gamePhaseChanged", (phase) => {
      if (phase === "voting") {
        navigation.navigate("Voting");
      }
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("timerUpdate");
      socket.off("nightResults");
      socket.off("gamePhaseChanged");
    };
  }, [navigation]);

  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);

  const renderPlayer = ({ item }) => (
    <PlayerCard
      player={item}
      showRole={false}
      style={[styles.playerCard, !item.isAlive && styles.deadPlayerCard]}
    />
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>☀️ Discussion Phase</Text>

      <TimerBar
        duration={120}
        timeLeft={timeLeft}
        label="Discussion Time"
        color="#f39c12"
        warningColor="#e67e22"
        dangerColor="#e74c3c"
      />

      {nightResults && (
        <Animated.View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>🌙 Last Night's Events</Text>
          <Text style={styles.resultsText}>{nightResults.message}</Text>
          {nightResults.eliminated && (
            <Text style={styles.eliminatedText}>
              💀 {nightResults.eliminated} was eliminated
            </Text>
          )}
        </Animated.View>
      )}

      <Text style={styles.instructions}>
        💬 Discuss who you think the killers are. Share information and
        suspicions carefully!
      </Text>

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>
          👥 Alive Players ({alivePlayers.length})
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
});
