/**
 * PlayerCard Component for LAN Mafia
 *
 * Displays player information in various game screens including
 * name, status (alive/dead), role (if revealed), and connection status.
 */
/**
 * Reusable UI component for displaying a player's name, status, and vote info.
 * Used in Lobby, Voting, and Discussion screens.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const PlayerCard = ({
  player,
  isHost = false,
  showRole = false,
  isSelectable = false,
  isSelected = false,
  onPress = null,
  onKick = null,
  showReadyStatus = false,
  isReady = false,
  style = {},
}) => {
  const getStatusColor = () => {
    if (!player.isConnected) return "#666666";
    if (!player.isAlive) return "#ff4444";
    return "#44ff44";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "killer":
        return "#ff0000";
      case "healer":
        return "#00ff00";
      case "police":
        return "#0000ff";
      case "townsperson":
        return "#ffaa00";
      default:
        return "#ffffff";
    }
  };

  const handlePress = () => {
    if (isSelectable && onPress) {
      onPress(player);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        !player.isConnected && styles.disconnected,
        !player.isAlive && styles.dead,
        style,
      ]}
      onPress={handlePress}
      disabled={!isSelectable}
      activeOpacity={isSelectable ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={[styles.name, !player.isAlive && styles.deadText]}>
          {player.name}
          {isHost && " 👑"}
        </Text>
        <View
          style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
        />
      </View>

      {showRole && player.role && (
        <Text style={[styles.role, { color: getRoleColor(player.role) }]}>
          {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.status}>
          {!player.isConnected
            ? "Disconnected"
            : !player.isAlive
            ? "Eliminated"
            : "Alive"}
        </Text>

        {showReadyStatus && !player.isHost && (
          <View style={styles.readyContainer}>
            <Text style={[styles.readyText, isReady && styles.readyActive]}>
              {isReady ? "✅ Ready" : "⏳ Not Ready"}
            </Text>
          </View>
        )}

        {player.isHost && <Text style={styles.hostLabel}>HOST</Text>}

        {onKick && !player.isHost && (
          <TouchableOpacity style={styles.kickButton} onPress={onKick}>
            <Text style={styles.kickButtonText}>❌</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: "#00aaff",
    backgroundColor: "#1a3a4a",
  },
  disconnected: {
    opacity: 0.6,
  },
  dead: {
    backgroundColor: "#3a2a2a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  deadText: {
    textDecorationLine: "line-through",
    color: "#aaaaaa",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  role: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  status: {
    fontSize: 12,
    color: "#cccccc",
  },
  hostLabel: {
    fontSize: 10,
    color: "#ffd700",
    fontWeight: "bold",
    backgroundColor: "#333333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readyContainer: {
    marginLeft: 8,
  },
  readyText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  readyActive: {
    color: "#00ff88",
  },
  kickButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 0, 0, 0.2)",
  },
  kickButtonText: {
    fontSize: 12,
    color: "#ff4444",
  },
});

export default PlayerCard;
