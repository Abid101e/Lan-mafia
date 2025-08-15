/**
 * Result Screen Component - Shows voting and night action results
 */

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

const { width } = Dimensions.get("window");

export default function ResultScreen({ navigation }) {
  const [results, setResults] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    socket.on("roundResults", setResults);
    socket.on("gamePhaseChanged", (phase) => {
      if (phase === "night") {
        navigation.navigate("NightPhase");
      } else if (phase === "discussion") {
        navigation.navigate("Discussion");
      } else if (phase === "game_over") {
        navigation.navigate("Win");
      }
    });

    socket.on("gameOver", (result) => {
      console.log("🏁 Result: Game over received:", result);
      navigation.navigate("Win");
    });

    return () => {
      socket.off("roundResults");
      socket.off("gamePhaseChanged");
      socket.off("gameOver");
    };
  }, [navigation]);

  const handleContinue = () => {
    socket.emit("continueGame");
  };

  if (!results) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📊 Calculating results...</Text>
          <Text style={styles.subText}>
            Please wait while we process the votes
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>📋 Round Results</Text>

      <View style={styles.resultsContainer}>
        {results.votingResult && (
          <>
            <Text style={styles.sectionTitle}>🗳️ Voting Results:</Text>
            <Text style={styles.resultText}>{results.votingResult}</Text>
          </>
        )}

        {results.eliminated && (
          <View style={styles.eliminationContainer}>
            <Text style={styles.eliminatedTitle}>💀 Player Eliminated</Text>
            <Text style={styles.eliminatedText}>{results.eliminated.name}</Text>
            <Text style={styles.roleReveal}>
              Role: {results.eliminated.role}
            </Text>
          </View>
        )}

        {results.nightResults && (
          <>
            <Text style={styles.sectionTitle}>🌙 Night Events:</Text>
            <Text style={styles.resultText}>{results.nightResults}</Text>
          </>
        )}

        {results.policeResults && (
          <>
            <Text style={styles.sectionTitle}>🔍 Investigation Results:</Text>
            <Text style={styles.resultText}>{results.policeResults}</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue to Next Phase</Text>
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
  resultsContainer: {
    backgroundColor: "#2c3e50",
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    marginTop: 15,
  },
  resultText: {
    fontSize: 16,
    color: "#ecf0f1",
    lineHeight: 22,
    marginBottom: 15,
  },
  eliminationContainer: {
    backgroundColor: "#e74c3c",
    padding: 20,
    borderRadius: 10,
    marginVertical: 15,
    alignItems: "center",
  },
  eliminatedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  eliminatedText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  roleReveal: {
    fontSize: 14,
    color: "#ffebee",
    fontStyle: "italic",
  },
  continueButton: {
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
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
