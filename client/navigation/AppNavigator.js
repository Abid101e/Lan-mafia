import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import JoinGameScreen from "../screens/JoinGameScreen";
import HostLobbyScreen from "../screens/HostLobbyScreen";
import LobbyScreen from "../screens/LobbyScreen";
import HostSettingsScreen from "../screens/HostSettingsScreen";
import RoleRevealScreen from "../screens/RoleRevealScreen";
import NightPhaseScreen from "../screens/NightPhaseScreen";
import DiscussionScreen from "../screens/DiscussionScreen";
import VotingScreen from "../screens/VotingScreen";
import ResultScreen from "../screens/ResultScreen";
import WinScreen from "../screens/WinScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1c1c1c" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="JoinGame" component={JoinGameScreen} />
        <Stack.Screen name="HostLobby" component={HostLobbyScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="HostSettings" component={HostSettingsScreen} />
        <Stack.Screen name="RoleReveal" component={RoleRevealScreen} />
        <Stack.Screen name="NightPhase" component={NightPhaseScreen} />
        <Stack.Screen name="Discussion" component={DiscussionScreen} />
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Win" component={WinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
