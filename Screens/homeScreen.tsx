import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

type RootStackParamList = {
  HostGame: undefined;
  // Add other screens here as needed
};

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LAN Mafia</Text>
      <View style={styles.buttonGroup}>
        <Button title="Host Game" onPress={() => {}} />
        <Button title="Join Game" onPress={() => {}} />
        <Button title="How to Play" onPress={() => {}} />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#1c1c1c',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonGroup: {
    gap: 20,
  },
});
