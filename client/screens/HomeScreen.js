import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const handleHostGame = () => {
    navigation.navigate("HostLobby");
  };

  const handleJoinGame = () => {
    navigation.navigate("JoinGame");
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={require("../assets/homebackground.jpg")}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Logo and Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎭</Text>
            </View>
            <Text style={styles.title}>LAN MAFIA</Text>
            <Text style={styles.subtitle}>The Ultimate Deception Game</Text>
            <View style={styles.decorativeLine} />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.hostButton]}
              onPress={handleHostGame}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>🎯</Text>
                <Text style={styles.buttonTitle}>HOST GAME</Text>
                <Text style={styles.buttonSubtitle}>
                  Create & lead a new game
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={handleJoinGame}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>🔗</Text>
                <Text style={styles.buttonTitle}>JOIN GAME</Text>
                <Text style={styles.buttonSubtitle}>
                  Find & join existing games
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Game Info Footer */}
          <View style={styles.footerSection}>
            <View style={styles.gameStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4-16</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>LAN</Text>
                <Text style={styles.statLabel}>Network</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>∞</Text>
                <Text style={styles.statLabel}>Fun</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
    paddingTop: (StatusBar.currentHeight || 0) + 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 3,
    borderColor: "rgba(255, 215, 0, 0.6)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoEmoji: {
    fontSize: 60,
    textAlign: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    marginBottom: 15,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 18,
    color: "#FFD700",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 30,
  },
  decorativeLine: {
    width: 100,
    height: 3,
    backgroundColor: "#FFD700",
    borderRadius: 2,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonSection: {
    flex: 2,
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 25,
  },
  actionButton: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    paddingVertical: 25,
    paddingHorizontal: 30,
  },
  hostButton: {
    backgroundColor: "rgba(255, 107, 107, 0.9)",
    borderWidth: 2,
    borderColor: "#FF5252",
  },
  joinButton: {
    backgroundColor: "rgba(78, 205, 196, 0.9)",
    borderWidth: 2,
    borderColor: "#26A69A",
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footerSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  gameStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFD700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});
