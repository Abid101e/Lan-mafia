import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isValidIPAddress } from "../utils/networkUtils";

const HomeScreen = () => {
  const [playerName, setPlayerName] = useState("");
  const [hostIP, setHostIP] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScales = {
    host: useRef(new Animated.Value(1)).current,
    join: useRef(new Animated.Value(1)).current,
    back: useRef(new Animated.Value(1)).current,
    help: useRef(new Animated.Value(1)).current,
  };

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, titleAnim]);

  // Button press animations
  const animateButtonPress = (
    buttonName: "host" | "join" | "back" | "help",
    isPressed: boolean
  ) => {
    Animated.spring(buttonScales[buttonName], {
      toValue: isPressed ? 0.95 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleHostGame = () => {
    if (!playerName.trim()) {
      Alert.alert("Enter Agent Name", "Please enter your codename to proceed.");
      return;
    }
    router.push({ pathname: "/host-game", params: { playerName } });
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      Alert.alert("Enter Agent Name", "Please enter your codename to proceed.");
      return;
    }
    if (!hostIP.trim()) {
      Alert.alert(
        "Enter Server Address",
        "Please enter the server IP address."
      );
      return;
    }
    if (!isValidIPAddress(hostIP)) {
      Alert.alert("Invalid Address", "Please enter a valid IP address.");
      return;
    }
    router.push({ pathname: "/join-game", params: { playerName, hostIP } });
  };

  const showHowToPlay = () => {
    Alert.alert(
      "🎭 Mission Briefing",
      "Welcome, Agent! In this covert operation, players are secretly assigned roles. Your mission: identify and eliminate the mafia before they take control. Trust no one, question everything, and may the best agents survive.",
      [{ text: "UNDERSTOOD", style: "default" }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Background gradient overlay */}
      <View style={styles.backgroundOverlay} />

      <Animated.ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: titleAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>LAN MAFIA</Text>
          <Text style={styles.subtitle}>🎭 A Dark Multiplayer Experience</Text>
        </Animated.View>

        {/* Main Content Card */}
        <Animated.View
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {!isJoining ? (
            // Main Menu
            <>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>👤 AGENT CODENAME</Text>
                <TextInput
                  style={styles.input}
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="Enter your identity..."
                  placeholderTextColor="#666"
                  maxLength={20}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !playerName.trim() && styles.disabledButton,
                  ]}
                  onPress={handleHostGame}
                  onPressIn={() => animateButtonPress("host", true)}
                  onPressOut={() => animateButtonPress("host", false)}
                  disabled={!playerName.trim()}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.buttonContent,
                      { transform: [{ scale: buttonScales.host }] },
                    ]}
                  >
                    <Text style={styles.buttonIcon}>🏠</Text>
                    <Text style={styles.primaryButtonText}>HOST OPERATION</Text>
                    <Text style={styles.buttonSubtext}>Create new session</Text>
                  </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setIsJoining(true)}
                  onPressIn={() => animateButtonPress("join", true)}
                  onPressOut={() => animateButtonPress("join", false)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.buttonContent,
                      { transform: [{ scale: buttonScales.join }] },
                    ]}
                  >
                    <Text style={styles.buttonIcon}>🔗</Text>
                    <Text style={styles.secondaryButtonText}>INFILTRATE</Text>
                    <Text style={styles.buttonSubtext}>
                      Join existing operation
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Join Game Form
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setIsJoining(false)}
                onPressIn={() => animateButtonPress("back", true)}
                onPressOut={() => animateButtonPress("back", false)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{ transform: [{ scale: buttonScales.back }] }}
                >
                  <Text style={styles.backButtonText}>← BACK TO HQ</Text>
                </Animated.View>
              </TouchableOpacity>

              <View style={styles.joinForm}>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>👤 AGENT CODENAME</Text>
                  <TextInput
                    style={styles.input}
                    value={playerName}
                    onChangeText={setPlayerName}
                    placeholder="Enter your identity..."
                    placeholderTextColor="#666"
                    maxLength={20}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>🌐 TARGET SERVER</Text>
                  <TextInput
                    style={styles.input}
                    value={hostIP}
                    onChangeText={setHostIP}
                    placeholder="192.168.1.100"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    (!playerName.trim() || !hostIP.trim()) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleJoinGame}
                  onPressIn={() => animateButtonPress("join", true)}
                  onPressOut={() => animateButtonPress("join", false)}
                  disabled={!playerName.trim() || !hostIP.trim()}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.buttonContent,
                      { transform: [{ scale: buttonScales.join }] },
                    ]}
                  >
                    <Text style={styles.buttonIcon}>🚀</Text>
                    <Text style={styles.joinButtonText}>
                      COMMENCE INFILTRATION
                    </Text>
                    <Text style={styles.buttonSubtext}>
                      Enter the operation
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>

        {/* Help Button */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={showHowToPlay}
            onPressIn={() => animateButtonPress("help", true)}
            onPressOut={() => animateButtonPress("help", false)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{ transform: [{ scale: buttonScales.help }] }}
            >
              <Text style={styles.helpButtonText}>📋 MISSION BRIEFING</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* Version Info */}
      <Text style={styles.versionText}>v1.0 • LAN Edition</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#dc2626",
    letterSpacing: 4,
    textAlign: "center",
    textShadowColor: "rgba(220, 38, 38, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    letterSpacing: 1,
  },
  mainCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
    fontWeight: "500",
  },
  actionButtons: {
    gap: 16,
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  secondaryButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  buttonSubtext: {
    color: "#999",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  backButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  joinForm: {
    gap: 20,
  },
  joinButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  helpButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  helpButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  versionText: {
    position: "absolute",
    bottom: 16,
    right: 16,
    color: "#555",
    fontSize: 11,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
