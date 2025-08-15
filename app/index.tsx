import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HomeScreen from '../Screens/HomeScreen';
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <HomeScreen />
   
  );
};

export default App;
