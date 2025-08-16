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

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const TimerBar = React.memo(
  ({
    duration = 60, // Duration in seconds
    timeLeft = null, // Time left from server (takes priority over internal timer)
    onTimeUp = null,
    isActive = true,
    showText = true,
    color = "#00aaff",
    warningColor = "#ffaa00",
    dangerColor = "#ff4444",
    style = {},
    label = "Time Remaining",
  }) => {
    const [internalTimeLeft, setInternalTimeLeft] = useState(duration);
    const [animatedWidth] = useState(new Animated.Value(100));
    const [isWarning, setIsWarning] = useState(false);
    const [isDanger, setIsDanger] = useState(false);

    // Use ref to avoid stale closure issues
    const intervalRef = useRef(null);

    // Use server timeLeft if provided, otherwise use internal timer
    const currentTimeLeft = timeLeft !== null ? timeLeft : internalTimeLeft;

    // Memoize threshold calculations
    const thresholds = useMemo(
      () => ({
        danger: duration * 0.2,
        warning: duration * 0.4,
      }),
      [duration]
    );

    // Memoize color calculation
    const currentColor = useMemo(() => {
      if (isDanger) return dangerColor;
      if (isWarning) return warningColor;
      return color;
    }, [isDanger, isWarning, dangerColor, warningColor, color]);

    // Memoize time formatting
    const formattedTime = useMemo(() => {
      const minutes = Math.floor(currentTimeLeft / 60);
      const seconds = currentTimeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, [currentTimeLeft]);

    const handleTimeUp = useCallback(() => {
      if (onTimeUp) onTimeUp();
    }, [onTimeUp]);

    // Update internal timer when duration changes (only if not using server timeLeft)
    useEffect(() => {
      if (timeLeft === null) {
        setInternalTimeLeft(duration);
        animatedWidth.setValue(100);
        setIsWarning(false);
        setIsDanger(false);
      }
    }, [duration, animatedWidth, timeLeft]);

    // Update progress bar and warning states when time changes
    useEffect(() => {
      const percentage = (currentTimeLeft / duration) * 100;

      // Update progress bar with optimized animation
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Update warning states using memoized thresholds
      if (currentTimeLeft <= thresholds.danger) {
        setIsDanger(true);
        setIsWarning(false);
      } else if (currentTimeLeft <= thresholds.warning) {
        setIsWarning(true);
        setIsDanger(false);
      } else {
        setIsWarning(false);
        setIsDanger(false);
      }

      if (currentTimeLeft <= 0) {
        handleTimeUp();
      }
    }, [currentTimeLeft, duration, animatedWidth, thresholds, handleTimeUp]);

    // Internal timer (only runs if not using server timeLeft)
    useEffect(() => {
      if (timeLeft === null && isActive && internalTimeLeft > 0) {
        intervalRef.current = setInterval(() => {
          setInternalTimeLeft((prevTime) => {
            const newTime = prevTime - 1;
            return newTime;
          });
        }, 1000);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [isActive, internalTimeLeft, timeLeft]);

    return (
      <View style={[styles.container, style]}>
        {showText && (
          <View style={styles.textContainer}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.timeText, { color: currentColor }]}>
              {formattedTime}
            </Text>
          </View>
        )}

        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBackground, { borderColor: currentColor }]}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: currentColor,
                  width: animatedWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {isDanger && (
          <Text style={styles.urgentText}>⚠️ Time Running Out!</Text>
        )}
      </View>
    );
  }
);

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
