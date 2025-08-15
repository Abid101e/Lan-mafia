/**
 * VoteButton Component for LAN Mafia
 *
 * Interactive button for voting and making selections during game phases.
 * Provides visual feedback and different states.
 */
/**
 * Styled button for voting.
 * Shows selected state and triggers vote submission.
 * Used in VotingScreen.
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

const VoteButton = ({
  title = "Vote",
  player = null,
  isSelected = false,
  isDisabled = false,
  variant = "primary", // 'primary', 'secondary', 'danger', 'success'
  size = "medium", // 'small', 'medium', 'large'
  onPress = null,
  style = {},
  icon = null,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: isSelected ? "#0066cc" : "#004499",
          borderColor: "#0088ff",
        };
      case "secondary":
        return {
          backgroundColor: isSelected ? "#666666" : "#444444",
          borderColor: "#888888",
        };
      case "danger":
        return {
          backgroundColor: isSelected ? "#cc0000" : "#990000",
          borderColor: "#ff4444",
        };
      case "success":
        return {
          backgroundColor: isSelected ? "#00cc00" : "#009900",
          borderColor: "#44ff44",
        };
      default:
        return {
          backgroundColor: isSelected ? "#0066cc" : "#004499",
          borderColor: "#0088ff",
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minHeight: 36,
        };
      case "large":
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          minHeight: 56,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          minHeight: 44,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress(player);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        isDisabled && styles.disabled,
        isSelected && styles.selected,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && (
          <Text style={[styles.icon, { fontSize: getTextSize() }]}>{icon}</Text>
        )}
        <Text
          style={[
            styles.text,
            { fontSize: getTextSize() },
            isDisabled && styles.disabledText,
          ]}
        >
          {player ? `Vote ${player.name}` : title}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  disabled: {
    backgroundColor: "#2a2a2a",
    borderColor: "#555555",
    opacity: 0.6,
  },
  selected: {
    transform: [{ scale: 0.98 }],
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
    color: "#ffffff",
  },
  text: {
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  disabledText: {
    color: "#aaaaaa",
  },
  checkmark: {
    marginLeft: 8,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default VoteButton;
