/**
 * TimerBar Component for LAN Mafia
 *
 * Visual countdown timer with progress bar for game phases.
 * Shows remaining time and provides visual urgency indicators.
 */
/**
 * Animated countdown bar used in discussion and voting phases.
 * Shows remaining time visually and numerically.
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const TimerBar = ({
  duration = 60, // Duration in seconds
  onTimeUp = null,
  isActive = true,
  showText = true,
  color = "#00aaff",
  warningColor = "#ffaa00",
  dangerColor = "#ff4444",
  style = {},
  label = "Time Remaining",
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [animatedWidth] = useState(new Animated.Value(100));
  const [isWarning, setIsWarning] = useState(false);
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    animatedWidth.setValue(100);
    setIsWarning(false);
    setIsDanger(false);
  }, [duration]);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          const percentage = (newTime / duration) * 100;

          // Update progress bar
          Animated.timing(animatedWidth, {
            toValue: percentage,
            duration: 500,
            useNativeDriver: false,
          }).start();

          // Update warning states
          if (newTime <= duration * 0.2) {
            // Last 20%
            setIsDanger(true);
            setIsWarning(false);
          } else if (newTime <= duration * 0.4) {
            // Last 40%
            setIsWarning(true);
            setIsDanger(false);
          } else {
            setIsWarning(false);
            setIsDanger(false);
          }

          if (newTime <= 0 && onTimeUp) {
            onTimeUp();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, duration, onTimeUp, animatedWidth]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBarColor = () => {
    if (isDanger) return dangerColor;
    if (isWarning) return warningColor;
    return color;
  };

  const getTextColor = () => {
    if (isDanger) return dangerColor;
    if (isWarning) return warningColor;
    return "#ffffff";
  };

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.timeText, { color: getTextColor() }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBackground, { borderColor: getBarColor() }]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getBarColor(),
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>

      {isDanger && <Text style={styles.urgentText}>⚠️ Time Running Out!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    marginVertical: 5,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#cccccc",
    fontWeight: "500",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  progressContainer: {
    width: "100%",
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#333333",
    borderRadius: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  urgentText: {
    fontSize: 12,
    color: "#ff4444",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "bold",
  },
});

export default TimerBar;
