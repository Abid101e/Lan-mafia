/**
 * RoleCard Component for LAN Mafia
 *
 * Displays role information including name, description, abilities,
 * and visual styling for role reveal and reference screens.
 */
/**
 * Displays a role with its icon, name, and color-coded badge.
 * Used in RoleRevealScreen and potentially in win/result screens.
 */

import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const RoleCard = ({
  role,
  isRevealed = false,
  showDescription = true,
  showAbilities = true,
  style = {},
}) => {
  const getRoleData = (roleName) => {
    const roles = {
      killer: {
        name: "Killer",
        color: "#ff0000",
        backgroundColor: "#330000",
        description:
          "You are part of the Mafia. Eliminate townspeople during the night.",
        abilities: [
          "Choose someone to eliminate each night",
          "Win when killers equal or outnumber town",
        ],
        icon: "🔪",
        team: "Mafia",
      },
      healer: {
        name: "Healer",
        color: "#00ff00",
        backgroundColor: "#003300",
        description: "You can save someone from elimination each night.",
        abilities: [
          "Protect one player each night",
          "Cannot heal the same person twice in a row",
        ],
        icon: "💊",
        team: "Town",
      },
      police: {
        name: "Police",
        color: "#0000ff",
        backgroundColor: "#000033",
        description: "You can investigate players to learn their allegiance.",
        abilities: [
          "Investigate one player each night",
          "Learn if they are suspicious or innocent",
        ],
        icon: "🔍",
        team: "Town",
      },
      townsperson: {
        name: "Townsperson",
        color: "#ffaa00",
        backgroundColor: "#332200",
        description:
          "You are an innocent citizen trying to identify the killers.",
        abilities: [
          "Vote during the day phase",
          "Use discussion to find killers",
        ],
        icon: "👤",
        team: "Town",
      },
    };

    return roles[roleName] || roles.townsperson;
  };

  const roleData = getRoleData(role);

  if (!isRevealed) {
    return (
      <View style={[styles.container, styles.hidden, style]}>
        <Text style={styles.hiddenIcon}>❓</Text>
        <Text style={styles.hiddenText}>Your Role</Text>
        <Text style={styles.hiddenSubtext}>Tap to reveal</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: roleData.backgroundColor },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{roleData.icon}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.roleName, { color: roleData.color }]}>
            {roleData.name}
          </Text>
          <Text style={styles.team}>Team: {roleData.team}</Text>
        </View>
      </View>

      {showDescription && (
        <Text style={styles.description}>{roleData.description}</Text>
      )}

      {showAbilities && roleData.abilities && (
        <View style={styles.abilitiesContainer}>
          <Text style={styles.abilitiesTitle}>Abilities:</Text>
          {roleData.abilities.map((ability, index) => (
            <Text key={index} style={styles.ability}>
              • {ability}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 20,
    margin: 10,
    borderWidth: 2,
    borderColor: "#444444",
    minHeight: 200,
  },
  hidden: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  hiddenText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  hiddenSubtext: {
    fontSize: 14,
    color: "#aaaaaa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  icon: {
    fontSize: 40,
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  roleName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  team: {
    fontSize: 14,
    color: "#cccccc",
    fontStyle: "italic",
  },
  description: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 22,
    marginBottom: 15,
  },
  abilitiesContainer: {
    marginTop: 10,
  },
  abilitiesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  ability: {
    fontSize: 14,
    color: "#dddddd",
    marginBottom: 4,
    paddingLeft: 10,
  },
});

export default RoleCard;
