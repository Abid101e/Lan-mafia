import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { socket } from "../utils/socket";
import TimerBar from "../components/TimerBar";
import PlayerCard from "../components/PlayerCard";

const { width } = Dimensions.get("window");

export default function VotingScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    socket.on("playersUpdated", setPlayers);
    socket.on("timerUpdate", setTimeLeft);
    socket.on("voteCounts", setVoteCounts);
    socket.on("gamePhaseChanged", (phase) => {
      if (phase === "results") {
        navigation.navigate("Result");
      } else if (phase === "game_over") {
        navigation.navigate("Win");
      }
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("timerUpdate");
      socket.off("voteCounts");
      socket.off("gamePhaseChanged");
    };
  }, [navigation]);

  const alivePlayers = players.filter((p) => p.isAlive && !p.isCurrentPlayer);

  const submitVote = () => {
    if (selectedPlayer && !voteSubmitted) {
      socket.emit("vote", { targetId: selectedPlayer });
      setVoteSubmitted(true);
    }
  };

  const renderPlayer = ({ item }) => {
    const canVote = item.isAlive && !item.isCurrentPlayer && !voteSubmitted;
    const isSelected = selectedPlayer === item.id;
    const voteCount = voteCounts[item.id] || 0;

    if (!item.isAlive || item.isCurrentPlayer) return null;

    return (
      <TouchableOpacity
        style={[
          styles.playerItem,
          isSelected && styles.selectedPlayer,
          !canVote && styles.disabledPlayer,
        ]}
        onPress={() => canVote && setSelectedPlayer(item.id)}
        disabled={!canVote}
      >
        <PlayerCard
          player={item}
          showRole={false}
          isSelected={isSelected}
          style={styles.playerCard}
        />
        <View style={styles.voteInfo}>
          <Text style={styles.voteCount}>Votes: {voteCount}</Text>
          {isSelected && <Text style={styles.selectedText}>SELECTED</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>🗳️ Voting Phase</Text>

      <TimerBar
        duration={60}
        timeLeft={timeLeft}
        label="Voting Time"
        color="#e74c3c"
        warningColor="#f39c12"
        dangerColor="#c0392b"
      />

      <Text style={styles.instructions}>
        🕵️ Vote to eliminate the player you suspect is a killer!
      </Text>

      <Text style={styles.playersTitle}>
        Choose Your Target ({alivePlayers.length} players):
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

      <TouchableOpacity
        style={[
          styles.voteButton,
          (!selectedPlayer || voteSubmitted) && styles.disabledButton,
          voteSubmitted && styles.submittedButton,
        ]}
        onPress={submitVote}
        disabled={!selectedPlayer || voteSubmitted}
      >
        <Text style={styles.voteButtonText}>
          {voteSubmitted
            ? "✓ Vote Submitted"
            : selectedPlayer
            ? "🗳️ Cast Vote"
            : "Select a Player"}
        </Text>
      </TouchableOpacity>

      {voteSubmitted && (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>
            Your vote has been cast! Waiting for other players...
          </Text>
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
  instructions: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  playersTitle: {
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
    backgroundColor: "#2c3e50",
    borderRadius: 10,
    padding: 5,
    borderWidth: 2,
    borderColor: "#e74c3c",
  },
  disabledPlayer: {
    opacity: 0.5,
  },
  playerCard: {
    width: width * 0.4,
  },
  voteInfo: {
    marginTop: 5,
    alignItems: "center",
  },
  voteCount: {
    color: "#f39c12",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectedText: {
    color: "#e74c3c",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  voteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: "center",
    minWidth: 200,
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: "#7f8c8d",
    shadowColor: "#7f8c8d",
  },
  submittedButton: {
    backgroundColor: "#27ae60",
    shadowColor: "#27ae60",
  },
  voteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  submittedContainer: {
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  submittedText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
